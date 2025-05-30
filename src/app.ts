import express, { ErrorRequestHandler } from "express";
import "./config/passport";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import globalErrorHandler from "./services/errorService";

class App {
  public app: express.Application;

  constructor() {
    console.log("🚀 App is running in " + process.env.NODE_ENV + " mode...");
    this.app = express();
    this.middlewaresConfiguraion();
    this.routesConfiguration();

    // Error handling
    this.app.use(globalErrorHandler as ErrorRequestHandler);
  }

  private middlewaresConfiguraion(): void {
    // CORS configuration
    this.app.use(
      cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
      })
    );

    // Session configuration
    this.app.use(
      session({
        secret: process.env.SESSION_SECRET as string,
        resave: false,
        saveUninitialized: false,
      })
    );

    // Passport initialization
    this.app.use(passport.initialize());
    this.app.use(passport.session());

    // JSON body parser
    this.app.use(express.json());
  }

  private routesConfiguration(): void {
    this.app.use("/api/v1/auth", authRoutes);
    this.app.use("/api/v1/users", userRoutes);
  }
}

export default new App().app;
