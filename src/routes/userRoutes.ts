import express from "express";
const router = express.Router();
import multer, { memoryStorage } from "multer";
import { protect } from "../middleware/authMiddleware";
import {
  secureFileUpload,
  securityLogger,
  enhancedAuthCheck,
} from "../middleware/securityMiddleware";

import {
  createUser,
  getUserById,
  getUsers,
  updateFirstLoginStatus,
} from "../services/userService";
import { 
  handleIdImageUpload,
  handleSelfieUpload,
  handleIdImageUploadEnhanced
} from "../services/userService";

// upload user id and selfie
const upload = multer({
  storage: memoryStorage(),
});

// Original ID upload (deprecated - use enhanced version)
router.post("/upload-id", 
  protect,
  enhancedAuthCheck,
  upload.single("idImage"),
  secureFileUpload,
  securityLogger("ID_UPLOAD"),
  handleIdImageUpload
);

// Enhanced ID upload with better validation
router.post("/upload-id-enhanced",
  protect,
  enhancedAuthCheck,
  upload.single("idImage"),
  secureFileUpload,
  securityLogger("ID_UPLOAD_ENHANCED"),
  handleIdImageUploadEnhanced
);

// Selfie upload for face verification
router.post("/upload-selfie",
  protect,
  enhancedAuthCheck,
  upload.single("selfieImage"),
  secureFileUpload,
  securityLogger("SELFIE_UPLOAD"),
  handleSelfieUpload
);

// user routes
// TODO: ADD protect middleware
router.route("/").get(protect, getUsers).post(createUser);
router.route("/:userId").get(protect, getUserById);
router
  .route("/update_first_login_state/:userId")
  .patch(protect, updateFirstLoginStatus);

export default router;
