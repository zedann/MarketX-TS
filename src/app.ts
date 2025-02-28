import express, { ErrorRequestHandler } from "express";
import "./config/passport";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import authRoutes from "./routes/auth";
import ErrorHandler from "./services/errorService";
class App {
  public app: express.Application;
  constructor() {
    this.app = express();
    this.middlewaresConfiguraion();
    this.routesConfiguration();

    // Error handling
    let errorHandler = new ErrorHandler();
    this.app.use(errorHandler.globalErrorHandler as ErrorRequestHandler);
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

    this.app.use(express.json());
  }
  private routesConfiguration(): void {
    this.app.use("/auth", authRoutes);
  }
}

export default new App().app;
