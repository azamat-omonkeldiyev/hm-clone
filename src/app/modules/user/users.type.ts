import mongoose, { Document } from "mongoose";

// Main User Interface for MongoDB Document
export interface IUser extends Document {
    username?: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: "admin" | "agent" | "user";
    bio?: string;
    subrole?: ("seller" | "buyer" | "agent")[];
    properties: mongoose.Types.ObjectId[];
    status: "active" | "inactive" | "block" | "pending" | "deleted";
    profilePicture?: string;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
    oauth?: boolean;
    resetPasswordOtp?: string;
    resetPasswordOtpExpire?: Date;
    tokenVersion?: number; // For token versioning in refresh tokens
}

// Interface for User Query Parameters
export interface IUserQuery {
    role?: "admin" | "agent" | "user";
    status?: "active" | "inactive" | "block" | "pending" | "deleted";
    sortBy?: "recent" | "status" | "a-z";
}


export type TSortOption = Record<string, 1 | -1>;

// Simplified User Type (e.g., for API Responses)
export interface UserType {
    _id: string;
    name: string;
    role: "admin" | "agent" | "user";
}



// Extend Request interface to include user property
export interface AuthenticatedRequest extends Request {
    user: IUser & { _id: string };
}
