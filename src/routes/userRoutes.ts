import express from "express";
const router = express.Router();
import multer, { memoryStorage } from "multer";
import { protect } from "../middleware/authMiddleware";

import {
  createUser,
  getUserById,
  getUsers,
  updateFirstLoginStatus,
} from "../services/userService";
import { handleIdImageUpload } from "../services/userService";

// upload user id
const upload = multer({
  storage: memoryStorage(),
});
router.post("/upload-id", upload.single("idImage"), handleIdImageUpload);

// user routes
// TODO: ADD protect middleware
router.route("/").get(protect, getUsers).post(createUser);
router.route("/:userId").get(protect, getUserById);
router
  .route("/update_first_login_state/:userId")
  .patch(protect, updateFirstLoginStatus);

export default router;
