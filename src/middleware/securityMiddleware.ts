import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import helmet from "helmet";
import { body, validationResult } from "express-validator";
import xss from "xss";
import AppError from "../utils/appError";
import { HTTP_CODES } from "../types";
import userModel from "../models/user";

// A07: Authentication Failures - Rate Limiting for Login Attempts
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: {
    error: "Too many login attempts from this IP, please try again after 15 minutes.",
    code: "RATE_LIMIT_EXCEEDED"
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests
  skipSuccessfulRequests: true,
  // Custom key generator to track by IP + email combination
  keyGenerator: (req: Request) => {
    return `${req.ip}-${req.body.email || 'unknown'}`;
  }
});

// A07: More restrictive rate limiting for password reset requests
export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    error: "Too many password reset attempts. Please try again in 1 hour.",
    code: "RATE_LIMIT_EXCEEDED"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// A07: Rate limiting for registration attempts
export const registrationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 registration attempts per hour
  message: {
    error: "Too many registration attempts. Please try again in 1 hour.",
    code: "RATE_LIMIT_EXCEEDED"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// A07: General API rate limiting
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
    code: "RATE_LIMIT_EXCEEDED"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// A07: Slow down middleware for repeated requests
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 10, // Allow 10 requests per windowMs without delay
  delayMs: 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 20000, // Maximum delay of 20 seconds
});

// A05: Security Misconfiguration - Security Headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow for API usage
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
});

// A03: Injection Prevention - Input Sanitization
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize all string inputs to prevent XSS
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return xss(obj.trim());
    } else if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    } else if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

// A03: SQL Injection Prevention - Parameter validation
export const validateSQLParams = (req: Request, res: Response, next: NextFunction) => {
  // Check for common SQL injection patterns
  const sqlInjectionPatterns = [
    /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b)/i,
    /(\bOR\b|\bAND\b)\s+[\'\"]?[\w\s]*[\'\"]?\s*=\s*[\'\"]?[\w\s]*[\'\"]?/i,
    /[\'\"];?\s*(-{2}|\/\*)/,
    /[\'\"];\s*(DROP|DELETE|UPDATE|INSERT)/i
  ];

  const checkValue = (value: any): boolean => {
    if (typeof value === 'string') {
      return sqlInjectionPatterns.some(pattern => pattern.test(value));
    }
    return false;
  };

  const checkObject = (obj: any): boolean => {
    if (typeof obj === 'string') {
      return checkValue(obj);
    } else if (Array.isArray(obj)) {
      return obj.some(checkObject);
    } else if (obj && typeof obj === 'object') {
      return Object.values(obj).some(checkObject);
    }
    return false;
  };

  if (checkObject(req.body) || checkObject(req.query) || checkObject(req.params)) {
    return next(new AppError("Invalid input detected", HTTP_CODES.BAD_REQUEST));
  }

  next();
};

// A01: Broken Access Control - Enhanced Authentication Check
export const enhancedAuthCheck = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if user exists and is active
    if (req.user) {
      const user = await userModel.findById((req.user as any).id);
      if (!user || !user.is_active) {
        return next(new AppError("Account access denied", HTTP_CODES.UNAUTHORIZED));
      }
      
      // Update last seen
      await userModel.updateLastLogin(user.id);
      req.user = user;
    }
    next();
  } catch (error) {
    next(new AppError("Authentication verification failed", HTTP_CODES.UNAUTHORIZED));
  }
};

// A07: Account Lockout Mechanism
export const checkAccountLockout = async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;
  
  if (!email) {
    return next();
  }

  try {
    const user = await userModel.findByEmail(email);
    if (user) {
      // Check if account is locked (this would require adding lockout fields to user model)
      const now = new Date();
      if (user.locked_until && new Date(user.locked_until) > now) {
        const timeRemaining = Math.ceil((new Date(user.locked_until).getTime() - now.getTime()) / (1000 * 60));
        return next(new AppError(
          `Account is temporarily locked. Try again in ${timeRemaining} minutes.`,
          HTTP_CODES.LOCKED
        ));
      }
    }
    next();
  } catch (error) {
    next();
  }
};

// A08: File Upload Security
export const secureFileUpload = (req: Request, res: Response, next: NextFunction) => {
  if (req.file) {
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (req.file.size > maxSize) {
      return next(new AppError("File size too large. Maximum size is 10MB.", HTTP_CODES.BAD_REQUEST));
    }

    // Check file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return next(new AppError("Invalid file type. Only JPEG and PNG images are allowed.", HTTP_CODES.BAD_REQUEST));
    }

    // Check for malicious file names
    const maliciousPatterns = [
      /\.\./,  // Path traversal
      /[<>:"|?*]/,  // Invalid filename characters
      /\.(php|js|html|htm|asp|aspx|jsp)$/i,  // Executable extensions
    ];

    if (maliciousPatterns.some(pattern => pattern.test(req.file.originalname))) {
      return next(new AppError("Invalid filename detected.", HTTP_CODES.BAD_REQUEST));
    }

    // Rename file to prevent conflicts and hide original name
    const fileExtension = req.file.originalname.split('.').pop();
    req.file.filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${fileExtension}`;
  }
  next();
};

// A04: Insecure Design - Request Validation
export const validateRequest = (validations: any[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value
      }));
      
      return next(new AppError("Validation failed", HTTP_CODES.BAD_REQUEST, errorMessages));
    }
    next();
  };
};

// A09: Security Logging
export const securityLogger = (event: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const logData = {
      event,
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
      userId: (req.user as any)?.id || null,
      email: req.body?.email || null
    };

    // Log security events (in production, send to security monitoring system)
    console.log('SECURITY_EVENT:', JSON.stringify(logData));
    
    next();
  };
};

// Common validation rules
export const emailValidation = body('email')
  .isEmail()
  .normalizeEmail()
  .withMessage('Please provide a valid email address');

export const passwordValidation = body('password')
  .isLength({ min: 8, max: 12 })
  .withMessage('Password must be between 8-12 characters')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');

export const usernameValidation = body('username')
  .optional()
  .isLength({ min: 3, max: 20 })
  .withMessage('Username must be between 3-20 characters')
  .matches(/^[a-zA-Z0-9_]+$/)
  .withMessage('Username can only contain letters, numbers, and underscores')
  .not()
  .matches(/^[0-9]/)
  .withMessage('Username cannot start with a number');

// A02: Cryptographic Failures - Enhanced Token Security
export const generateSecureToken = (): string => {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
};

export const hashSensitiveData = (data: string): string => {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(data).digest('hex');
}; 