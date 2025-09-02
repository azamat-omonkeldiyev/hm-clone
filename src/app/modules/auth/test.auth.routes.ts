import express from "express";
import { testRegister, testLogin, testRefreshToken, testLogout } from "./test.auth.controller";

const router = express.Router();

router.post("/test-register", testRegister);
router.post("/test-login", testLogin);
router.post("/test-refresh-token", testRefreshToken);
router.post("/test-logout", testLogout);

export default router;
