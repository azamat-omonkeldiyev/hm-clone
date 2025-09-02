// auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// Define User Type
interface UserType extends JwtPayload {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
}

// Extend Express Request to include `user`
declare module "express-serve-static-core" {
    interface Request {
        user?: UserType;
    }
}


export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const secretKey = process.env.JWT_SECRET;
        if (!secretKey) {
            throw new Error("JWT secret key is not defined.");
        }

        // Explicitly cast the decoded token as UserType
        const decoded = jwt.verify(token, secretKey) as UserType;

        if (!decoded.id) {
            return res.status(403).json({ message: "Invalid token: No user ID found" });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: "Invalid or expired token" });
    }
};

export const verifyTokenAndUserMatch = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const secretKey = process.env.JWT_SECRET;
        if (!secretKey) {
            throw new Error("JWT secret key is not defined.");
        }

        const decoded = jwt.verify(token, secretKey) as UserType;

        if (!decoded.id) {
            return res.status(403).json({ message: "Invalid token: No user ID found" });
        }

        // Get userId from params or body as per your routes
        const paramUserId = req.params.userId || req.body.userId;

        if (!paramUserId) {
            return res.status(400).json({ message: "User ID is required in params or body" });
        }

        if (decoded.id !== paramUserId) {
            return res.status(403).json({ message: "Forbidden: Token user ID does not match request user ID" });
        }

        req.user = decoded; // attach decoded user to request for further use
        next();
    } catch (error) {
        return res.status(403).json({ message: "Invalid or expired token" });
    }
};

// Middleware to check if the user is an admin
export const verifyAdmin = (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: No user information available" });
        }

        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Forbidden: Admins only" });
        }

        next();
    } catch (error) {
        return res.status(500).json({ message: "Server error while verifying admin" });
    }
};







