import express from "express";
import {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    getBlockedUsers,
    getSeller,
    checkUsername,
    getUserProfile,
    updateUserProfile,
    getUsersByStatus,
    getBuyers,
    getUserCounts,
    restoreUser,
    getDeletedUsers,
} from "./users.controllers";
import { verifyTokenAndUserMatch } from "../../middleware/auth.middleware";
import upload from "../../middleware/multer";
import { createUser } from "../auth/auth.controllers";
// import { syncAllPropertiesToElastic } from "../property/property.controllers";

const router = express.Router();


router.get("/get-all-users", getAllUsers);
router.get("/get-users-count", getUserCounts); //app
router.get("/blocked-users", getBlockedUsers);
router.get("/status-user", getUsersByStatus); //app
router.get("/get-buyer", getBuyers);
// syncAllPropertiesToElastic
// router.get("/sync-properties", syncAllPropertiesToElastic);
router.get("/get-single-user/:id", getUserById);
router.get("/get-seller", getSeller);
router.get("/profile", getUserProfile);
router.post("/create-user", createUser);
router.post("/check-username", checkUsername);
router.put("/update-user/:id", updateUser);

router.put("/update-profile/:userId", verifyTokenAndUserMatch, upload.single('profileImage'), updateUserProfile);
router.patch("/delete-user/:id", deleteUser);
// Restore a soft-deleted user
router.patch("/restore/:id", restoreUser);
router.get("/deleted", getDeletedUsers);

export default router;
