import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User, Role } from "../models";

const JWT_SECRET = process.env.JWT_SECRET || "agentbuy_secret_key_change_in_production";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
      };
    }
  }
}

export const generateToken = (userId: string, role: Role): string => {
  return jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: "30d" });
};

export const generateTempToken = (email: string): string => {
  return jwt.sign({ email, type: "password_reset" }, JWT_SECRET, { expiresIn: "15m" });
};

export const verifyTempToken = (token: string): { email: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string; type: string };
    if (decoded.type !== "password_reset") return null;
    return { email: decoded.email };
  } catch {
    return null;
  }
};

/**
 * Required authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const auth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Нэвтрэлт шаардлагатай" });
      return;
    }

    const token = authHeader.substring(7);

    let decoded: { id: string; role: Role };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: Role };
    } catch {
      res.status(401).json({ error: "Токен хүчингүй эсвэл хугацаа дууссан" });
      return;
    }

    const user = await User.findById(decoded.id).select("_id role").lean();
    if (!user) {
      res.status(401).json({ error: "Хэрэглэгч олдсонгүй" });
      return;
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ error: "Серверийн алдаа" });
  }
};

/**
 * Optional authentication - continues even without token
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: Role };
    const user = await User.findById(decoded.id).select("_id role").lean();

    if (user) {
      req.user = {
        id: user._id.toString(),
        role: user.role,
      };
    }
  } catch {
    // Continue without auth
  }

  next();
};
