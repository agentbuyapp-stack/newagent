import { Request, Response, NextFunction } from "express";
import { createClerkClient, verifyToken } from "@clerk/backend";
import { prisma } from "../lib/prisma";
import { Role } from "@prisma/client";

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
) => {
  try {
    // Get the Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }

    const sessionToken = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify the session token with Clerk
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
    
    let clerkUser;
    try {
      // Verify the token to get the session claims
      const { sub: userId } = await verifyToken(sessionToken, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      if (!userId) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }

      // Get user from Clerk
      clerkUser = await clerk.users.getUser(userId);
    } catch (tokenError: any) {
      console.error("Token verification error:", tokenError);
      // If verifyToken fails, try alternative method
      if (tokenError.message?.includes("verifyToken") || tokenError.status === 401) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }
      throw tokenError;
    }
    
    if (!clerkUser) {
      return res.status(401).json({ error: "User not found in Clerk" });
    }

    // Sync user with database (create if doesn't exist)
    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) {
      return res.status(400).json({ error: "User email not found" });
    }

    // Get or create user in database
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        // Create new user with default role "user"
        // You can customize role assignment based on Clerk metadata if needed
        const role = (clerkUser.publicMetadata?.role as Role) || "user";
        
        user = await prisma.user.create({
          data: {
            email: email.toLowerCase(),
            role: role,
          },
        });
      }
    } catch (dbError: any) {
      console.error("Database error in clerkAuth:", dbError);
      console.error("Database error details:", {
        message: dbError.message,
        code: dbError.code,
        meta: dbError.meta,
      });
      // If database connection fails, return 500 error
      return res.status(500).json({ 
        error: "Database connection error",
        message: process.env.NODE_ENV === "development" ? dbError.message : undefined
      });
    }

    // Attach user to request
    req.user = {
      id: user.id,
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
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    res.status(500).json({ 
      error: "Internal server error",
      message: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

