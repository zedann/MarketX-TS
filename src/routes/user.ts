import express from "express";
const router = express.Router();
import multer, { memoryStorage } from "multer";
import path from "path";

import {
  createUser,
  getUsers,
  updateFirstLoginStatus,
} from "../services/userService";
import { handleIdImageUpload } from "../services/userService";

// upload user id
const upload = multer({
  storage: memoryStorage(),
});

router.post("/upload-id", upload.single("idImage"), handleIdImageUpload);

router.route("/").get(getUsers).post(createUser);
router.route("/update_login_state/:userId").patch(updateFirstLoginStatus);

export default router;
