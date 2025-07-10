import express, { ErrorRequestHandler } from "express";
import "./config/passport";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import securityRoutes from "./routes/securityRoutes";
import investmentRoutes from "./routes/investmentRoutes";
import homeRoutes from "./routes/homeRoutes";
import walletRoutes from "./routes/walletRoutes";
import stockRoutes from "./routes/stockRoutes";
import noahRoutes from "./routes/noahRoutes";
import globalErrorHandler from "./services/errorService";
import {
  securityHeaders,
  generalRateLimit,
  speedLimiter,
  sanitizeInput,
  validateSQLParams,
} from "./middleware/securityMiddleware";

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
    // A05: Security headers (must be first)
    this.app.use(securityHeaders);

    // A07: Rate limiting
    this.app.use(generalRateLimit);
    this.app.use(speedLimiter);

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
        cookie: {
          secure: process.env.NODE_ENV === 'production', // HTTPS only in production
          httpOnly: true, // Prevent XSS
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          sameSite: 'strict' // CSRF protection
        }
      })
    );

    // Passport initialization
    this.app.use(passport.initialize());
    this.app.use(passport.session());

    // JSON body parser with size limit
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // A03: Input sanitization and validation
    this.app.use(sanitizeInput);
    this.app.use(validateSQLParams);
  }

  private routesConfiguration(): void {
    this.app.use("/api/v1/auth", authRoutes);
    this.app.use("/api/v1/users", userRoutes);
    this.app.use("/api/v1/security", securityRoutes);
    this.app.use("/api/v1/investments", investmentRoutes);
    this.app.use("/api/v1/home", homeRoutes);
    this.app.use("/api/v1/wallet", walletRoutes);
    this.app.use("/api/v1/stocks", stockRoutes);
    this.app.use("/api/v1/noah", noahRoutes);
  }
}

export default new App().app;
