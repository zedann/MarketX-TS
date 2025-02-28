import { Request, Response, NextFunction } from "express";
import AppError from "../utils/appError";

class ErrorHandler {
  // Handle invalid database values (e.g., invalid ID format)
  private handleCastErrorDB(err: any): AppError {
    const message = `Invalid ${err.column}: ${err.value}.`;
    return new AppError(message, 400);
  }

  // Handle duplicate field errors in PostgreSQL (Error Code 23505)
  private handleDuplicateFieldsDB(err: any): AppError {
    const message = `Duplicate field value. Please use another value!`;
    return new AppError(message, 400);
  }

  // Handle validation errors in database
  private handleValidationErrorDB(err: any): AppError {
    const errors = Object.values(err.errors || {}).map((el: any) => el.message);
    const message = `Invalid input data. ${errors.join(". ")}`;
    return new AppError(message, 400);
  }

  // Handle JWT-related errors
  private handleJWTError(): AppError {
    return new AppError("Invalid token. Please log in again!", 401);
  }

  private handleJWTExpiredError(): AppError {
    return new AppError("Your token has expired! Please log in again.", 401);
  }

  // Send error response in development mode
  private sendErrorDev(err: AppError, req: Request, res: Response): Response {
    if (req.originalUrl.startsWith("/api")) {
      return res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack,
      });
    }

    console.error("ERROR 💥", err);
    return res.status(err.statusCode).json({
      title: "Something went wrong!",
      message: err.message,
    });
  }

  // Send error response in production mode
  private sendErrorProd(err: AppError, req: Request, res: Response): Response {
    if (req.originalUrl.startsWith("/api")) {
      if (err.isOperational) {
        return res.status(err.statusCode).json({
          status: err.status,
          message: err.message,
        });
      }

      console.error("ERROR 💥", err);
      return res.status(500).json({
        status: "error",
        message: "Something went very wrong!",
      });
    }

    console.error("ERROR 💥", err);
    return res.status(err.statusCode).json({
      title: "Something went wrong!",
      message: err.isOperational ? err.message : "Please try again later.",
    });
  }

  // Global error handling middleware
  public globalErrorHandler(
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    let error = err;
    error.statusCode = error.statusCode || 500;
    error.status = error.status || "error";

    if (process.env.NODE_ENV === "development") {
      return this.sendErrorDev(error, req, res);
    } else if (process.env.NODE_ENV === "production") {
      let processedError = { ...error, message: error.message };

      if (error.name === "QueryFailedError" && error.code === "22P02")
        processedError = this.handleCastErrorDB(error);
      if (error.code === "23505")
        processedError = this.handleDuplicateFieldsDB(error);
      if (error.name === "ValidationError")
        processedError = this.handleValidationErrorDB(error);
      if (error.name === "JsonWebTokenError")
        processedError = this.handleJWTError();
      if (error.name === "TokenExpiredError")
        processedError = this.handleJWTExpiredError();

      return this.sendErrorProd(processedError, req, res);
    }
  }
}

export default ErrorHandler;
