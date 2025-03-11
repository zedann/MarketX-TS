import { Request, Response, NextFunction } from "express";
import AppError from "../utils/appError";
import { HTTP_CODES } from "../types";

const globalErrorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("global error handler");
  err.statusCode = err.statusCode || HTTP_CODES.INTERNAL_SERVER_ERROR;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      stack: err.stack,
      error: err,
    });
  } else if (process.env.NODE_ENV === "production") {
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {
      console.error("ERROR 💥", err);
      res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
        status: "error",
        message: "Something went very wrong!",
      });
    }
  }
};

export default globalErrorHandler;
