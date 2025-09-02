// user.controller.ts
import { Request, Response } from "express";
import { hashPassword } from "../../../utils/password";
import { IUserQuery, TSortOption } from "./users.type";
import { sendResponse } from "../../../utils/response";
import { User } from "../../modules/user/users.model";
import jwt, { JwtPayload } from "jsonwebtoken";
import { uploadToCloudinary } from "../../../utils/uploadToCloudinary";
import bcrypt from "bcrypt";

// ────────────────────────────────────────────────────────────────
// 🟢 USER RETRIEVAL
// ────────────────────────────────────────────────────────────────

// Get all users with sorting and filtering
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const { role, status, sortBy } = req.query as IUserQuery;
        const filter: IUserQuery = {};
        if (role) filter.role = role;
        if (status) filter.status = status;

        const sortOption: TSortOption = sortBy === "recent"
            ? { createdAt: -1 }
            : sortBy === "status"
                ? { status: 1 }
                : sortBy === "a-z"
                    ? { username: 1 }
                    : {};

        const users = await User.find(filter).select("-password").sort(sortOption);

        return sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "Users fetched successfully",
            data: users,
        });
    } catch (err) {
        console.error("Error fetching users:", err);
        return sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to fetch users",
            error: err instanceof Error ? err.message : "Unknown error",
        });
    }
};

// Get a single user by ID
export const getUserById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id).select("-password").populate("properties");
        if (!user) {
            return res.status(200).json({ message: "User not found" });
        }

        res.status(200).json(user);
    } catch (err) {
        console.error("Error fetching user:", err);
        res.status(500).json({ message: "Failed to fetch user" });
    }
};

// Get user data from token
export const getUserFromToken = async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return sendResponse({
                res,
                statusCode: 401,
                status: "error",
                message: "Unauthorized: No token provided",
            });
        }

        const token = authHeader.split(" ")[1];
        const secretKey = process.env.JWT_SECRET;
        if (!secretKey) throw new Error("JWT secret key is not defined.");

        const decoded = jwt.verify(token, secretKey) as { id: string };
        const user = await User.findById(decoded.id).select("-password").populate("properties");

        if (!user) {
            return sendResponse({
                res,
                statusCode: 200,
                status: "error",
                message: "User not found",
            });
        }

        return sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "User fetched successfully",
            data: user,
        });
    } catch (error) {
        console.error("Error fetching user from token:", error);
        return sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to fetch user",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

// Fetch the user's profile data
export const getUserProfile = async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return sendResponse({
                res,
                statusCode: 401,
                status: "error",
                message: "Unauthorized: No token provided",
            });
        }

        const secretKey = process.env.JWT_SECRET;
        if (!secretKey) throw new Error("JWT secret key is not defined.");

        const decoded = jwt.verify(token, secretKey) as JwtPayload & { id: string };
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return sendResponse({
                res,
                statusCode: 200,
                status: "error",
                message: "User not found",
            });
        }

        return sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "User profile fetched successfully",
            data: user,
        });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to fetch user profile",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

// Check if username exists
export const checkUsername = async (req: Request, res: Response) => {
    const { username } = req.body;

    if (!username) {
        return sendResponse({
            res,
            statusCode: 400,
            status: 'error',
            message: 'Username is required',
        });
    }

    try {
        const user = await User.findOne({ username });

        return sendResponse({
            res,
            statusCode: 200,
            status: 'success',
            message: user ? 'Username is already taken' : 'Username is available',
            data: { exists: !!user },
        });
    } catch (error) {
        console.error('Error checking username availability:', error);
        return sendResponse({
            res,
            statusCode: 500,
            status: 'error',
            message: 'An error occurred while checking username availability',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

// Get user counts
export const getUserCounts = async (req: Request, res: Response): Promise<void> => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const [totalUsers, newUsers] = await Promise.all([
            User.countDocuments({ deleted: false }),
            User.countDocuments({ createdAt: { $gte: sevenDaysAgo }, deleted: false }),
        ]);

        sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "User counts fetched successfully",
            data: { totalUsers, newUsersLast7Days: newUsers },
        });
    } catch (error) {
        console.error("Error fetching user counts:", error);
        sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to fetch user counts",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

// ────────────────────────────────────────────────────────────────
// 🟡 ROLE/STATUS-BASED FETCH
// ────────────────────────────────────────────────────────────────

export const getBlockedUsers = async (req: Request, res: Response) => {
    try {
        const blockedUsers = await User.find({ status: "block" }).select("-password");

        return sendResponse({
            res,
            statusCode: 200,
            status: blockedUsers.length > 0 ? "success" : "error",
            message: blockedUsers.length > 0 ? "Blocked users fetched successfully" : "No blocked users found",
            data: blockedUsers.length > 0 ? blockedUsers : undefined,
        });
    } catch (err) {
        console.error("Error fetching blocked users:", err);
        return sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to fetch blocked users",
            error: err instanceof Error ? err.message : "Unknown error",
        });
    }
};

export const getUsersByStatus = async (req: Request, res: Response) => {
    try {
        const { status } = req.query;

        if (!status || !["pending", "block"].includes(status as string)) {
            return sendResponse({
                res,
                statusCode: 400,
                status: "error",
                message: "Invalid or missing status parameter. Valid values are 'pending' or 'block'.",
            });
        }

        const users = await User.find({ status }).select("-password");

        return sendResponse({
            res,
            statusCode: 200,
            status: users.length ? "success" : "error",
            message: users.length ? `Users fetched successfully` : `No users found with status: ${status}`,
            data: users.length ? users : undefined,
        });
    } catch (error) {
        console.error("Error fetching users by status:", error);
        return sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to fetch users by status",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

export const getBuyers = async (req: Request, res: Response): Promise<void> => {
    try {
        const { search } = req.query;
        const filter: Record<string, unknown> = {
            subrole: "buyer",
            status: "active",
        };

        if (typeof search === "string" && search.trim().length > 0) {
            filter.$or = [
                { firstName: { $regex: search, $options: "i" } },
                { lastName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { username: { $regex: search, $options: "i" } },
            ];
        }

        const buyers = await User.find(filter).select("-password");

        return sendResponse({
            res,
            statusCode: 200,
            status: buyers.length ? "success" : "error",
            message: buyers.length ? "Buyers fetched successfully" : "No buyers found",
            data: buyers.length ? buyers : undefined,
        });
    } catch (error) {
        console.error("Error fetching buyers:", error);
        return sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to fetch buyers",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

export const getSeller = async (req: Request, res: Response): Promise<void> => {
    try {
        const { ownerType, search } = req.query;
        const filter: Record<string, unknown> = {
            subrole: ownerType as string,
            status: "active",
        };

        if (typeof search === "string" && search.trim().length > 0) {
            filter.$or = [
                { firstName: { $regex: search, $options: "i" } },
                { lastName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { username: { $regex: search, $options: "i" } },
            ];
        }

        const sellers = await User.find(filter).select("-password");

        return sendResponse({
            res,
            statusCode: 200,
            status: sellers.length ? "success" : "error",
            message: sellers.length ? "Sellers fetched successfully" : "No sellers found",
            data: sellers.length ? sellers : undefined,
        });
    } catch (error) {
        console.error("Error fetching sellers:", error);
        sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to fetch sellers",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

// ────────────────────────────────────────────────────────────────
// 🟠 UPDATE
// ────────────────────────────────────────────────────────────────

// Admin updates a user
export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, phone, role, status, email, username, subrole } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(200).json({ message: "User not found" });
        }

        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (username) user.username = username;
        if (email) user.email = email;
        if (phone) user.phone = phone;
        if (role) user.role = role;
        if (subrole) user.subrole = subrole;
        if (status) user.status = status;

        const updatedUser = await user.save();
        res.status(200).json({ message: "User updated successfully", user: updatedUser });
    } catch (err) {
        console.error("Error updating user:", err);
        res.status(500).json({ message: "Failed to update user" });
    }
};

// User updates own profile
export const updateUserProfile = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { username, email, phone, bio, firstName, lastName, newPassword, currentPassword } = req.body;

        if (req.user?.id !== userId) {
            return sendResponse({
                res,
                statusCode: 403,
                status: "error",
                message: "You are not authorized to update this profile",
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return sendResponse({
                res,
                statusCode: 200,
                status: "error",
                message: "User not found",
            });
        }

        if (currentPassword) {
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return sendResponse({
                    res,
                    statusCode: 400,
                    status: "error",
                    message: "Current password is incorrect",
                });
            }
        } else {
            return sendResponse({
                res,
                statusCode: 400,
                status: "error",
                message: "Current password is required",
            });
        }

        if (username) user.username = username;
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (newPassword) user.password = await hashPassword(newPassword);
        if (email) user.email = email;
        if (phone) user.phone = phone;
        if (bio) user.bio = bio;

        if (req.file) {
            const folder = "user_profiles";
            const uploadedImage = await uploadToCloudinary(req.file.path, folder);
            user.profilePicture = uploadedImage;
        }

        const updatedUser = await user.save();

        return sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "Profile updated successfully",
            data: updatedUser,
        });
    } catch (err) {
        console.error("Error updating profile:", err);
        if (!res.headersSent) {
            return sendResponse({
                res,
                statusCode: 500,
                status: "error",
                message: "Failed to update profile",
                error: err instanceof Error ? err.message : "Unknown error",
            });
        }
    }
};

// ────────────────────────────────────────────────────────────────
// 🔴 DELETE
// ────────────────────────────────────────────────────────────────

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const user = await User.findByIdAndUpdate(
            id,
            {

                status: "deleted",
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "User deleted successfully" });
    } catch (err) {
        console.error("Error soft-deleting user:", err);
        res.status(500).json({ message: "Failed to delete user" });
    }
};

export const restoreUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const restoredUser = await User.findByIdAndUpdate(
            id,
            { status: "active" },
            { new: true }
        );

        if (!restoredUser) {
            return res.status(404).json({ message: "User not found" });
        }

        return sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "User restored successfully",
            data: restoredUser,
        });
    } catch (err) {
        console.error("Error restoring user:", err);
        return res.status(500).json({ message: "Failed to restore user" });
    }
};

export const getDeletedUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find({ status: "deleted" }).select("-password");

        return sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "Deleted users fetched successfully",
            data: users,
        });
    } catch (error) {
        return sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to fetch deleted users",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};


