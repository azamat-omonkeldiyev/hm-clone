import express from "express";
import { adminLogin, createUser, login, loginUser, loginUserWithRole, logout, logoutUser, oauthLoginUser, refresh, register, resetPasswordWithOtp, sellerLogin, sendResetOtp } from "./auth.controllers";
import { verifyToken } from "../../middleware/auth.middleware";
import { getUserFromToken } from "../user/users.controllers";

const router = express.Router();


router.post("/login", loginUser);
router.post("/logout", logoutUser);

// Admin login route
router.post('/admin-login', (req, res) => {
    req.body.loginType = 'admin';
    loginUserWithRole(req, res);
});

// Seller login route
router.post('/seller-login', (req, res) => {
    req.body.loginType = 'seller';
    loginUserWithRole(req, res);
});
router.post("/oauth-login", oauthLoginUser);
router.post("/registration", createUser);
router.get("/user", verifyToken, getUserFromToken);

router.post("/send-reset-otp", sendResetOtp);
router.post("/reset-password-otp", resetPasswordWithOtp);

// updated auth routes to include access token and refresh token
router.post("/v2/login", login);
router.post("/v2/logout", logout);
router.post("/v2/register", register);
router.post("/v2/refresh-token", refresh);
// admin login route
router.post('/v2/admin-login', adminLogin);
// seller login route
router.post('/v2/seller-login', sellerLogin);

export default router;
