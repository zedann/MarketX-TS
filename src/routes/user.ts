import express from "express";
const router = express.Router();
import multer from "multer";
import path from "path";

import { getUsers } from "../services/userService";

// upload user id
const storage = multer.diskStorage({
  destination: path.join(__dirname, "../uploads"),
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({
  dest: "uploads/",
});

router.post("/upload-id", upload.single("file"), async (req, res) => {});

router.route("/").get(getUsers);

export default router;
