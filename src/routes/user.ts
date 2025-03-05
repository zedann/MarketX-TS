import express from "express";
const router = express.Router();
import multer, { memoryStorage } from "multer";
import path from "path";

import { getUsers, updateFirstLoginStatus } from "../services/userService";
import { handleIdImageUpload } from "../services/authService";

// upload user id
const upload = multer({
  storage: memoryStorage(),
});

router.post("/upload-id", upload.single("idImage"), handleIdImageUpload);

router.route("/").get(getUsers);
router.route("/update_login_state/:userId").patch(updateFirstLoginStatus);

export default router;
