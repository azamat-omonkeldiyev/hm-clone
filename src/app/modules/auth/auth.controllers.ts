import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../user/users.model";
import { sendResponse } from "../../../utils/response";
import { hashPassword } from "../../../utils/password";
import { sendEmail } from "../../../utils/sendEmail";
import { generateOtp } from "../../../utils/generateOtp";


export const createUser = async (req: Request, res: Response) => {
    try {
        const { username, email, password, firstName, lastName, phone, role, isActive } = req.body;

        const existingEmailUser = await User.findOne({ email });
        if (existingEmailUser) {
            return sendResponse({
                res,
                statusCode: 400,
                status: "error",
                message: "Email already exists",
            });
        }

        let finalUsername = username || email.split("@")[0].toLowerCase();
        let isUsernameTaken = await User.findOne({ username: finalUsername });

        while (isUsernameTaken) {
            finalUsername = `${finalUsername}${Math.floor(Math.random() * 1000)}`;
            isUsernameTaken = await User.findOne({ username: finalUsername });
        }

        const hashedPassword = await hashPassword(password);
        const newUser = new User({
            username: finalUsername,
            email,
            password: hashedPassword,
            firstName,
            lastName,
            phone,
            role,
            isActive,
        });

        const savedUser = await newUser.save();
        return sendResponse({
            res,
            statusCode: 201,
            status: "success",
            message: "User created successfully",
            data: savedUser,
        });
    } catch (err) {
        console.error("Error creating user:", err);
        return sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to create user",
            error: err instanceof Error ? err.message : "Unknown error",
        });
    }
};
export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;


        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Verify the password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Generate a JWT token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET as string,
            { expiresIn: "1h" }
        );


        res.status(200).json({
            message: "Login successful",
            token,

        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "An error occurred while logging in" });
    }
};
export const loginUserWithRole = async (req: Request, res: Response) => {
    try {
        const { email, password, loginType } = req.body;

        if (!email || !password || !loginType) {
            return res.status(400).json({ message: "Email, password, and login type are required." });
        }

        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Verify the password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        // Role-based access check
        if (loginType === 'admin' && user.role !== 'admin') {
            return res.status(403).json({ message: "Unauthorized: Not an admin." });
        }

        if (loginType === 'seller' && !(user.subrole as string[]).includes('seller')) {
            return res.status(403).json({ message: "Unauthorized: Not a seller." });
        }

        // Generate JWT token with role and subrole details
        const token = jwt.sign(
            { id: user._id, name: user.firstName + " " + user.lastName, role: user.role, subrole: user.subrole },
            process.env.JWT_SECRET as string,
            { expiresIn: "7d" }
        );

        res.status(200).json({
            message: "Login successful",
            token,
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "An error occurred while logging in." });
    }
};
export const oauthLoginUser = async (req: Request, res: Response) => {
    try {
        const { email, name, picture } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        let user = await User.findOne({ email });

        if (!user) {
            // Split name into first and last name
            const [firstName, ...lastNameParts] = name?.split(" ") || ["Google", "User"];
            const lastName = lastNameParts.join(" ");

            user = await User.create({
                email,
                username: email.split("@")[0],
                firstName,
                lastName,
                profilePicture: picture,
                role: "user",
                subrole: ["buyer"],
                status: "active",
                lastLogin: new Date(),
                oauth: true,
            });
        } else {
            // Update lastLogin
            user.lastLogin = new Date();
            await user.save();
        }

        return res.status(200).json({
            success: true,
            id: user._id,
            email: user.email,
            username: user.username,
            role: user.role,
            subrole: user.subrole,
        });
    } catch (err) {
        console.error("OAuth login error:", err);
        return res.status(500).json({ message: "OAuth login failed" });
    }
};

// auth.controllers.ts

export const logoutUser = async (req: Request, res: Response) => {
    try {

        res.clearCookie("token", {
            httpOnly: true,
            secure: true,         // set true if you're using HTTPS
            sameSite: "strict",   // helps prevent CSRF
        });

        // Optional: Clear refresh token too if used
        res.clearCookie("refresh_token", {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
        });

        return res.status(200).json({ message: "Logout successful" });
    } catch (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
    }
};

export const sendResetOtp = async (req: Request, res: Response) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = generateOtp();
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpire = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
    await user.save();

    await sendEmail(user.email, "Your OTP Code", `Your OTP code is: ${otp}`);

    return res.status(200).json({ message: "OTP sent to email" });
};


export const resetPasswordWithOtp = async (req: Request, res: Response) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: "Email, OTP, and new password are required" });
        }

        const user = await User.findOne({
            email,
            resetPasswordOtp: otp,
            resetPasswordOtpExpire: { $gt: new Date() },
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        // Hash the new password and update
        user.password = await hashPassword(newPassword);
        user.resetPasswordOtp = undefined;
        user.resetPasswordOtpExpire = undefined;
        await user.save();

        return res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
        console.error("Error resetting password with OTP:", error);
        return res.status(500).json({ message: "Failed to reset password" });
    }
};


// updated controller to support access token and refresh token
export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, firstName, lastName, phone, username } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }

        let finalUsername = username || email.split("@")[0].toLowerCase();

        // Check if username exists, and generate a unique one if needed
        let isUsernameTaken = await User.findOne({ username: finalUsername });
        while (isUsernameTaken) {
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            finalUsername = `${email.split("@")[0].toLowerCase()}${randomSuffix}`;
            isUsernameTaken = await User.findOne({ username: finalUsername });
        }

        const hashedPassword = await hashPassword(password);

        const newUser = await User.create({
            email,
            password: hashedPassword,
            username: finalUsername,
            firstName,
            lastName,
            phone,
            role: "user",
            subrole: ["buyer"],
            status: "active",
        });

        return res.status(201).json({
            message: "User registered successfully",
            user: {
                id: newUser._id,
                email: newUser.email,
                username: newUser.username,
            },
        });
    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({ message: "Registration failed" });
    }
};
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const payload = {
            id: user._id,
            role: user.role,
            subrole: user.subrole,
            tokenVersion: user.tokenVersion || 0, // fallback if undefined
        };

        const accessToken = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: "15m" });
        const refreshToken = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: "7d" });

        res.cookie("refresh_token", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            path: "/api/auth/v2/refresh-token",
        });

        return res.status(200).json({
            message: "Login successful",
            accessToken,
            refreshToken
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Login failed" });
    }
};

export const refresh = async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken) return res.status(401).json({ message: "Refresh token missing" });

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET as string) as any;

        const user = await User.findById(decoded.id);
        if (!user || user.tokenVersion !== decoded.tokenVersion) {
            return res.status(403).json({ message: "Token no longer valid" });
        }

        const payload = {
            id: user._id,
            role: user.role,
            subrole: user.subrole,
            tokenVersion: user.tokenVersion,
        };

        const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: "15m" });

        return res.status(200).json({ accessToken: newAccessToken });
    } catch (error) {
        return res.status(403).json({ message: "Invalid refresh token" });
    }
};

export const logout = async (req: Request, res: Response) => {
    try {
        // 1. Try to get refreshToken from cookie
        let refreshToken = req.cookies?.refresh_token;

        // 2. If not in cookie, check Authorization header
        if (!refreshToken && req.headers.authorization?.startsWith("Bearer ")) {
            refreshToken = req.headers.authorization.split(" ")[1];
        }

        // 3. Optional: Also support getting from body (last fallback)
        if (!refreshToken && req.body?.refreshToken) {
            refreshToken = req.body.refreshToken;
        }

        // 4. If we have the token, verify and invalidate
        if (refreshToken) {
            try {
                const decoded = jwt.verify(
                    refreshToken,
                    process.env.JWT_SECRET as string
                ) as { id: string };

                if (decoded?.id) {
                    await User.findByIdAndUpdate(decoded.id, {
                        $inc: { tokenVersion: 1 },
                    });
                }
            } catch (verifyErr) {
                console.warn("Invalid refresh token provided during logout.");
            }
        }

        // 5. Always clear cookie for web clients (safe no-op for mobile)
        res.clearCookie("refresh_token", {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
        });

        return res.status(200).json({
            success: true,
            message: "Logout successful. Refresh token invalidated.",
        });

    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({
            success: false,
            message: "Logout failed. Please try again.",
        });
    }
};

// seller login
export const sellerLogin = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        if (!user?.subrole?.includes("seller")) {
            return res.status(403).json({ message: "Access denied. Not a seller." });
        }

        const payload = {
            id: user._id,
            role: user.role,
            subrole: user.subrole,
            tokenVersion: user.tokenVersion || 0,
        };

        const accessToken = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: "15m" });
        const refreshToken = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: "7d" });

        res.cookie("refresh_token", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            path: "/api/auth/v2/refresh-token",
        });

        return res.status(200).json({
            message: "Seller login successful",
            accessToken,
            refreshToken,
        });
    } catch (error) {
        console.error("Seller login error:", error);
        return res.status(500).json({ message: "Login failed" });
    }
};

export const adminLogin = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        if (user.role !== "admin") {
            return res.status(403).json({ message: "Access denied. Not an admin." });
        }

        const payload = {
            id: user._id,
            role: user.role,
            subrole: user.subrole,
            tokenVersion: user.tokenVersion || 0,
        };

        const accessToken = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: "15m" });
        const refreshToken = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: "7d" });

        res.cookie("refresh_token", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            path: "/api/auth/v2/refresh-token",
        });

        return res.status(200).json({
            message: "Admin login successful",
            accessToken,
            refreshToken,
        });
    } catch (error) {
        console.error("Admin login error:", error);
        return res.status(500).json({ message: "Login failed" });
    }
};










