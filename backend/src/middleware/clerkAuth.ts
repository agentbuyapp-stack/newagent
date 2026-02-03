import { Request, Response, NextFunction } from "express";
import { createClerkClient, verifyToken } from "@clerk/backend";
import { User, Role } from "../models";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
        clerkId?: string;
      };
    }
  }
}

/**
 * Middleware to authenticate requests using Clerk
 * Expects Authorization header with Bearer token (Clerk session token)
 */
export const clerkAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get the Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Missing or invalid Authorization header" });
      return;
    }

    const sessionToken = authHeader.substring(7); // Remove "Bearer " prefix

    // Check if Clerk secret key is configured
    if (!process.env.CLERK_SECRET_KEY) {
      console.error("CLERK_SECRET_KEY is not set in environment variables");
      console.error("Tip: Set DISABLE_CLERK_AUTH=true in .env for development without Clerk");
      res.status(500).json({
        error: "Server configuration error",
        message: "Clerk authentication is not configured. Set CLERK_SECRET_KEY or DISABLE_CLERK_AUTH=true for development"
      });
      return;
    }

    // Verify the session token with Clerk
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

    let clerkUser;
    try {
      // Verify the token to get the session claims
      const { sub: userId } = await verifyToken(sessionToken, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      if (!userId) {
        console.error("Token verification failed: No userId returned");
        res.status(401).json({ error: "Invalid or expired token" });
        return;
      }

      // Get user from Clerk
      clerkUser = await clerk.users.getUser(userId);
    } catch (tokenError: any) {
      console.error("Token verification error:", tokenError);
      console.error("Token error details:", {
        message: tokenError.message,
        reason: tokenError.reason,
        action: tokenError.action,
        status: tokenError.status,
      });

      // If verifyToken fails, return proper error
      if (tokenError.reason === "jwk-failed-to-resolve") {
        res.status(500).json({
          error: "Clerk configuration error",
          message: "CLERK_SECRET_KEY is invalid or Clerk service is unavailable"
        });
        return;
      }

      if (tokenError.message?.includes("verifyToken") || tokenError.status === 401) {
        res.status(401).json({ error: "Invalid or expired token" });
        return;
      }

      res.status(500).json({
        error: "Authentication error",
        message: process.env.NODE_ENV === "development" ? tokenError.message : "Authentication failed"
      });
      return;
    }

    if (!clerkUser) {
      res.status(401).json({ error: "User not found in Clerk" });
      return;
    }

    // Sync user with database (create if doesn't exist)
    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) {
      res.status(400).json({ error: "User email not found" });
      return;
    }

    // Get or create user in database
    let user;
    try {
      user = await User.findOne({ email: email.toLowerCase() }).lean();

      if (!user) {
        // Create new user with default role "user"
        // You can customize role assignment based on Clerk metadata if needed
        const role = (clerkUser.publicMetadata?.role as Role) || "user";

        const newUser = await User.create({
          email: email.toLowerCase(),
          role: role,
        });
        user = newUser.toObject();
      }
    } catch (dbError: any) {
      console.error("Database error in clerkAuth:", dbError);
      console.error("Database error details:", {
        message: dbError.message,
        code: dbError.code,
      });
      // If database connection fails, return 500 error
      res.status(500).json({
        error: "Database connection error",
        message: process.env.NODE_ENV === "development" ? dbError.message : undefined
      });
      return;
    }

    // Attach user to request
    req.user = {
      id: user._id.toString(),
      role: user.role,
      clerkId: clerkUser.id,
    };

    next();
  } catch (error: any) {
    console.error("Error in clerkAuth middleware:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      status: error.status,
      statusCode: error.statusCode,
    });

    if (error.status === 401 || error.statusCode === 401) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    res.status(500).json({
      error: "Internal server error",
      message: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * Alias for clerkAuth - requires authentication
 */
export const requireClerkAuth = clerkAuth;

/**
 * Optional authentication - continues even if no token provided
 * Useful for routes that work for both guests and logged-in users
 */
export const optionalClerkAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  // If no auth header, continue without user
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // Set auth object for compatibility
    (req as any).auth = { userId: null };
    return next();
  }

  // If auth header exists, try to authenticate
  try {
    const sessionToken = authHeader.substring(7);

    if (!process.env.CLERK_SECRET_KEY) {
      (req as any).auth = { userId: null };
      return next();
    }

    const { sub: userId } = await verifyToken(sessionToken, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    (req as any).auth = { userId };
    next();
  } catch (error) {
    // On error, continue as guest
    (req as any).auth = { userId: null };
    next();
  }
};
