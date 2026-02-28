import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { User, Profile, PasswordReset } from "../models";
import { validateEmail } from "../utils/validation";
import { generateToken, generateTempToken, verifyTempToken } from "../middleware/auth";
import { cardService } from "../services/cardService";
import nodemailer from "nodemailer";

function validatePassword(password: string, phone: string): string | null {
  if (!password || typeof password !== "string") return "Нууц үг шаардлагатай";
  if (password.length < 4 || password.length > 6) return "Нууц үг 4-6 тэмдэгт байх ёстой";
  if (!/[a-zA-Z]/.test(password)) return "Нууц үгэнд дор хаяж 1 үсэг байх ёстой";
  for (let i = 0; i <= phone.length - password.length; i++) {
    if (phone.substring(i, i + password.length) === password) {
      return "Нууц үг утасны дугаарын нэг хэсэг байж болохгүй";
    }
  }
  return null;
}

function validatePhone(phone: string): string | null {
  if (!phone || typeof phone !== "string") return "Утасны дугаар шаардлагатай";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length !== 8) return "Утасны дугаар 8 оронтой байх ёстой";
  return null;
}

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, password, email, name } = req.body;

    const phoneError = validatePhone(phone);
    if (phoneError) { res.status(400).json({ error: phoneError }); return; }

    const cleanPhone = phone.replace(/\D/g, "");

    const passwordError = validatePassword(password, cleanPhone);
    if (passwordError) { res.status(400).json({ error: passwordError }); return; }

    if (!email || !validateEmail(email)) {
      res.status(400).json({ error: "Зөв email хаяг оруулна уу" }); return;
    }

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      res.status(400).json({ error: "Нэрээ оруулна уу" }); return;
    }

    const existingPhone = await User.findOne({ phone: cleanPhone }).lean();
    if (existingPhone) { res.status(409).json({ error: "Энэ утасны дугаар бүртгэлтэй байна" }); return; }

    const existingEmail = await User.findOne({ email: email.trim().toLowerCase() }).lean();
    if (existingEmail) { res.status(409).json({ error: "Энэ email бүртгэлтэй байна" }); return; }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      phone: cleanPhone,
      password: hashedPassword,
      email: email.trim().toLowerCase(),
      role: "user",
      orderCredits: 1,
    });

    // Profile автоматаар үүсгэх
    await Profile.create({
      userId: user._id,
      name: name.trim(),
      phone: cleanPhone,
      email: email.trim().toLowerCase(),
    });

    await cardService.grantInitialCards(user._id.toString());

    const token = generateToken(user._id.toString(), user.role);

    res.status(201).json({
      token,
      user: {
        id: user._id.toString(),
        phone: user.phone,
        email: user.email,
        role: user.role,
        orderCredits: user.orderCredits,
        researchCards: 1,
      },
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({ error: "Утас эсвэл email аль хэдийн бүртгэлтэй байна" }); return;
    }
    console.error("Register error:", error);
    res.status(500).json({ error: "Серверийн алдаа" });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      res.status(400).json({ error: "Утас болон нууц үг шаардлагатай" }); return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    const user = await User.findOne({ phone: cleanPhone });
    if (!user) { res.status(401).json({ error: "Утасны дугаар эсвэл нууц үг буруу" }); return; }

    if (!user.password) { res.status(401).json({ error: "Нууц үг тохируулагдаагүй. Админтай холбогдоно уу" }); return; }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) { res.status(401).json({ error: "Утасны дугаар эсвэл нууц үг буруу" }); return; }

    const profile = await Profile.findOne({ userId: user._id }).lean();
    const token = generateToken(user._id.toString(), user.role);

    res.json({
      token,
      user: {
        id: user._id.toString(),
        phone: user.phone,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        agentPoints: user.agentPoints || 0,
        researchCards: user.researchCards || 0,
        orderCredits: user.orderCredits || 0,
        profile: profile ? { ...profile, id: (profile as any)._id.toString(), userId: (profile as any).userId.toString() } : null,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Серверийн алдаа" });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ error: "Нэвтрэлт шаардлагатай" }); return; }

    const user = await User.findById(req.user.id).lean();
    if (!user) { res.status(404).json({ error: "Хэрэглэгч олдсонгүй" }); return; }

    const profile = await Profile.findOne({ userId: user._id }).lean();

    res.json({
      id: user._id.toString(),
      phone: user.phone,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved || false,
      approvedAt: user.approvedAt,
      approvedBy: user.approvedBy,
      agentPoints: user.agentPoints || 0,
      researchCards: user.researchCards || 0,
      orderCredits: user.orderCredits || 0,
      profile: profile ? { ...profile, id: (profile as any)._id.toString(), userId: (profile as any).userId.toString() } : null,
    });
  } catch (error) {
    console.error("GetMe error:", error);
    res.status(500).json({ error: "Серверийн алдаа" });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email || !validateEmail(email)) {
      res.status(400).json({ error: "Зөв email хаяг оруулна уу" }); return;
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).lean();
    if (!user) {
      res.json({ message: "Хэрэв энэ email бүртгэлтэй бол нууц үг сэргээх код илгээгдсэн" }); return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await PasswordReset.updateMany({ email: email.trim().toLowerCase(), used: false }, { used: true });
    await PasswordReset.create({
      email: email.trim().toLowerCase(),
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER || process.env.SMTP_USER,
          pass: process.env.EMAIL_APP_PASSWORD || process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || "AgentBuy <agentbuy.app@gmail.com>",
        to: email.trim().toLowerCase(),
        subject: "AgentBuy - Нууц үг сэргээх код",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:20px;">
            <div style="background:linear-gradient(135deg,#0b4ce5,#00d4ff);padding:20px;border-radius:12px 12px 0 0;text-align:center;">
              <h2 style="color:white;margin:0;">AgentBuy</h2>
            </div>
            <div style="background:#f9fafb;padding:30px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;">
              <p style="color:#374151;font-size:16px;">Нууц үг сэргээх код:</p>
              <div style="background:white;border:2px solid #0b4ce5;border-radius:12px;padding:20px;text-align:center;margin:20px 0;">
                <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#0b4ce5;">${otp}</span>
              </div>
              <p style="color:#6b7280;font-size:14px;">Энэ код 10 минутын дараа хүчингүй болно.</p>
            </div>
          </div>`,
      });
    } catch (emailError) {
      console.error("Email send error:", emailError);
    }

    res.json({ message: "Нууц үг сэргээх код email-ээр илгээгдсэн" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Серверийн алдаа" });
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) { res.status(400).json({ error: "Email болон код шаардлагатай" }); return; }

    const resetRecord = await PasswordReset.findOne({
      email: email.trim().toLowerCase(),
      otp,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!resetRecord) { res.status(400).json({ error: "Код буруу эсвэл хугацаа дууссан" }); return; }

    resetRecord.used = true;
    await resetRecord.save();

    const tempToken = generateTempToken(email.trim().toLowerCase());
    res.json({ tempToken });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ error: "Серверийн алдаа" });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tempToken, newPassword } = req.body;
    if (!tempToken || !newPassword) {
      res.status(400).json({ error: "Токен болон шинэ нууц үг шаардлагатай" }); return;
    }

    const decoded = verifyTempToken(tempToken);
    if (!decoded) { res.status(400).json({ error: "Токен хүчингүй эсвэл хугацаа дууссан" }); return; }

    const user = await User.findOne({ email: decoded.email });
    if (!user) { res.status(404).json({ error: "Хэрэглэгч олдсонгүй" }); return; }

    const passwordError = validatePassword(newPassword, user.phone || "");
    if (passwordError) { res.status(400).json({ error: passwordError }); return; }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Нууц үг амжилттай шинэчлэгдлээ" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Серверийн алдаа" });
  }
};

// Admin login — email + password
export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Имэйл болон нууц үг шаардлагатай" }); return;
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) { res.status(401).json({ error: "Имэйл эсвэл нууц үг буруу" }); return; }

    if (user.role !== "admin") { res.status(403).json({ error: "Та admin эрхгүй байна" }); return; }

    if (!user.password) { res.status(401).json({ error: "Нууц үг тохируулагдаагүй" }); return; }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) { res.status(401).json({ error: "Имэйл эсвэл нууц үг буруу" }); return; }

    const profile = await Profile.findOne({ userId: user._id }).lean();
    const token = generateToken(user._id.toString(), user.role);

    res.json({
      token,
      user: {
        id: user._id.toString(),
        phone: user.phone,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        agentPoints: user.agentPoints || 0,
        researchCards: user.researchCards || 0,
        orderCredits: user.orderCredits || 0,
        profile: profile ? { ...profile, id: (profile as any)._id.toString(), userId: (profile as any).userId.toString() } : null,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ error: "Серверийн алдаа" });
  }
};

// Setup admin — нууц түлхүүрээр admin эрх олгох
export const setupAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, secretKey } = req.body;

    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret) {
      res.status(500).json({ error: "ADMIN_SECRET тохируулагдаагүй байна (.env файлд нэмнэ үү)" });
      return;
    }

    if (!secretKey || secretKey !== adminSecret) {
      res.status(403).json({ error: "Нууц түлхүүр буруу байна" });
      return;
    }

    if (!phone) {
      res.status(400).json({ error: "Утасны дугаар шаардлагатай" });
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    const user = await User.findOne({ phone: cleanPhone });
    if (!user) {
      res.status(404).json({ error: "Хэрэглэгч олдсонгүй" });
      return;
    }

    user.role = "admin";
    await user.save();

    res.json({ message: `${cleanPhone} дугаартай хэрэглэгч admin болгогдлоо. Дахин нэвтэрнэ үү.` });
  } catch (error) {
    console.error("Setup admin error:", error);
    res.status(500).json({ error: "Серверийн алдаа" });
  }
};

// Claim account — хуучин хэрэглэгч утас+нууц үг тохируулах
export const claimAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tempToken, phone, newPassword } = req.body;
    if (!tempToken || !phone || !newPassword) {
      res.status(400).json({ error: "Бүх талбарыг бөглөнө үү" }); return;
    }

    const decoded = verifyTempToken(tempToken);
    if (!decoded) { res.status(400).json({ error: "Токен хүчингүй эсвэл хугацаа дууссан" }); return; }

    const user = await User.findOne({ email: decoded.email });
    if (!user) { res.status(404).json({ error: "Хэрэглэгч олдсонгүй" }); return; }

    // Validate phone
    const phoneError = validatePhone(phone);
    if (phoneError) { res.status(400).json({ error: phoneError }); return; }

    const cleanPhone = phone.replace(/\D/g, "");

    // Check phone not taken by another user
    const existingPhone = await User.findOne({ phone: cleanPhone, _id: { $ne: user._id } }).lean();
    if (existingPhone) { res.status(409).json({ error: "Энэ утасны дугаар аль хэдийн бүртгэлтэй байна" }); return; }

    // Validate password
    const passwordError = validatePassword(newPassword, cleanPhone);
    if (passwordError) { res.status(400).json({ error: passwordError }); return; }

    // Update user
    user.phone = cleanPhone;
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    // Auto-login after claiming
    const profile = await Profile.findOne({ userId: user._id }).lean();
    const token = generateToken(user._id.toString(), user.role);

    res.json({
      token,
      user: {
        id: user._id.toString(),
        phone: user.phone,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        agentPoints: user.agentPoints || 0,
        researchCards: user.researchCards || 0,
        orderCredits: user.orderCredits || 0,
        profile: profile ? { ...profile, id: (profile as any)._id.toString(), userId: (profile as any).userId.toString() } : null,
      },
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({ error: "Утасны дугаар аль хэдийн бүртгэлтэй байна" }); return;
    }
    console.error("Claim account error:", error);
    res.status(500).json({ error: "Серверийн алдаа" });
  }
};
