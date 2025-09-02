// test.auth.controller.ts
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const USERS: any[] = [];
const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || "test-access-secret";
const REFRESH_TOKEN_SECRET = process.env.JWT_SECRET || "test-refresh-secret";
let refreshTokens: string[] = [];

export const testRegister = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const existing = USERS.find(u => u.email === email);
    if (existing) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: Date.now(), email, password: hashedPassword };
    USERS.push(newUser);
    return res.status(201).json({ message: "User registered", user: { email } });
};

export const testLogin = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const user = USERS.find(u => u.email === email);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ message: "Invalid credentials" });

    const accessToken = jwt.sign({ id: user.id }, ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ id: user.id }, REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

    refreshTokens.push(refreshToken);
    res.cookie("refresh_token", refreshToken, { httpOnly: true, secure: false }); // Secure = false for test
    return res.json({ accessToken });
};

export const testRefreshToken = (req: Request, res: Response) => {
    const token = req.cookies.refresh_token;
    if (!token || !refreshTokens.includes(token)) return res.sendStatus(403);

    try {
        const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET) as any;
        const newAccessToken = jwt.sign({ id: decoded.id }, ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
        return res.json({ accessToken: newAccessToken });
    } catch {
        return res.sendStatus(403);
    }
};

export const testLogout = (req: Request, res: Response) => {
    const token = req.cookies.refresh_token;
    refreshTokens = refreshTokens.filter(t => t !== token);
    res.clearCookie("refresh_token");
    return res.status(200).json({ message: "Logged out" });
};
