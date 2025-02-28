import admin from "firebase-admin";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

// Load Firebase credentials from JSON file
// edit this using typescript
const serviceAccount = require(path.resolve(
  process.env.FIREBASE_CREDENTIALS as string
));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
