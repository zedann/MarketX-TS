import express from "express";
const router = express.Router();
import multer, { memoryStorage } from "multer";
import path from "path";

import {
  createUser,
  getUserById,
  getUsers,
  updateFirstLoginStatus,
} from "../services/userService";
import { handleIdImageUpload } from "../services/userService";

import { signIn, signUp } from "../services/authService";

// upload user id
const upload = multer({
  storage: memoryStorage(),
});
router.post("/upload-id", upload.single("idImage"), handleIdImageUpload);

// user routes

// user signUp and signIn
router.route("/singin").post(signIn);
router.route("/signup").post(signUp);
router.route("/").get(getUsers).post(createUser);
router.route("/:userId").get(getUserById);
router.route("/update_first_login_state/:userId").patch(updateFirstLoginStatus);

export default router;
