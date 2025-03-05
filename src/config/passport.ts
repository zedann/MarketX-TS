import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import userModel from "../models/user";
import { User } from "../models/user";
import { createUser } from "../services/userService";
import pool from "./db";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: "http://localhost:8080/auth/google/callback",
    },
    async function (
      accessToken: string,
      refreshToken: string,
      profile: any,
      cb: Function
    ) {
      try {
        let user = await userModel.findByGoogleId(profile.id);

        if (!user) {
          // Create new user
          user = await userModel.createUser({
            googleId: profile.id,
            fullname: profile.displayName,
            email: profile.emails[0].value,
            profilePic: profile.photos[0].value,
            userType: "user",
            isActive: true,
            birthday: "",
            passcode: "",
          });
        }

        // Update first login status and last login time
        await userModel.updateLastLogin(user.id);
      } catch (error) {
        return cb(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  // @ts-ignore
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    done(null, result.rows[0]);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
