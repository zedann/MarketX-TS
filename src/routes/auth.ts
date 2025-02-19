import express, { Request, Response } from "express";
import passport from "passport";

const router = express.Router();

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req: Request, res: Response) {
    res.redirect(process.env.FRONTEND_URL as string);
  }
);

router.get("/profile", (req: Request, res: Response) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
});

router.get("/logout", (req: Request, res: Response) => {
  req.logout((err: Error) => {
    if (err) {
      return res.status(500).json({ error: "Error logging out" });
    }
    res.redirect(process.env.FRONTEND_URL as string);
  });
});

export default router;
