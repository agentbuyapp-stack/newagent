import { NextFunction, Request, Response } from "express";
import { Role } from "../models";

export const requireRole = (allowed: Role | Role[]) => {
  const allowedList = Array.isArray(allowed) ? allowed : [allowed];
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }
    if (!allowedList.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden for role " + req.user.role });
    }
    next();
  };
};

export const parseRole = (value: string | undefined): Role | null => {
  if (!value) return "user";
  const normalized = value.toLowerCase();
  if (normalized === "user" || normalized === "agent" || normalized === "admin") {
    return normalized as Role;
  }
  return null;
};

