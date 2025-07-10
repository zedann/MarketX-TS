import express from "express";
import { protect } from "../middleware/authMiddleware";
import { securityService } from "../services/securityService";
import { APIResponse, HTTP_CODES } from "../types";
import { catchAsync } from "../utils/catchAsync";
import AppError from "../utils/appError";
import { securityLogger } from "../middleware/securityMiddleware";

const router = express.Router();

// A09: Security metrics endpoint (admin only)
router.get("/metrics",
  protect,
  securityLogger("SECURITY_METRICS_ACCESS"),
  catchAsync(async (req, res, next) => {
    // Check if user is admin (implement proper role-based access control)
    const user = req.user as any;
    if (user.user_type !== 'admin' && user.user_type !== 'superadmin') {
      return next(new AppError("Insufficient permissions", HTTP_CODES.FORBIDDEN));
    }

    const metrics = await securityService.getSecurityMetrics();
    
    res.status(HTTP_CODES.OK).json(
      new APIResponse("success", "Security metrics retrieved", metrics)
    );
  })
);

// A09: Security events for a specific IP (admin only)
router.get("/events/:ip",
  protect,
  securityLogger("SECURITY_EVENTS_IP_ACCESS"),
  catchAsync(async (req, res, next) => {
    const user = req.user as any;
    if (user.user_type !== 'admin' && user.user_type !== 'superadmin') {
      return next(new AppError("Insufficient permissions", HTTP_CODES.FORBIDDEN));
    }

    const { ip } = req.params;
    const { hours = 24 } = req.query;
    
    const events = securityService.getRecentEventsByIP(ip, Number(hours));
    
    res.status(HTTP_CODES.OK).json(
      new APIResponse("success", `Security events for IP ${ip}`, {
        ip,
        timeframe: `${hours} hours`,
        eventCount: events.length,
        events
      })
    );
  })
);

// A09: Security dashboard endpoint
router.get("/dashboard",
  protect,
  securityLogger("SECURITY_DASHBOARD_ACCESS"),
  catchAsync(async (req, res, next) => {
    const user = req.user as any;
    if (user.user_type !== 'admin' && user.user_type !== 'superadmin') {
      return next(new AppError("Insufficient permissions", HTTP_CODES.FORBIDDEN));
    }

    const metrics = await securityService.getSecurityMetrics();
    
    // Additional dashboard data
    const dashboardData = {
      ...metrics,
      systemStatus: {
        rateLimit: "ACTIVE",
        fileUploadSecurity: "ACTIVE",
        injectionProtection: "ACTIVE",
        accessControlLogging: "ACTIVE",
        securityHeaders: "ACTIVE"
      },
      alerts: [
        // This would be populated with active security alerts
      ],
      recommendations: [
        metrics.suspiciousIps.length > 0 ? "Review suspicious IP activity" : null,
        metrics.failedLoginAttempts > 50 ? "High number of failed login attempts detected" : null,
        metrics.lockedAccounts > 0 ? "Multiple accounts are currently locked" : null
      ].filter(Boolean)
    };
    
    res.status(HTTP_CODES.OK).json(
      new APIResponse("success", "Security dashboard data", dashboardData)
    );
  })
);

// A09: Clear old security events (admin only)
router.delete("/events/cleanup",
  protect,
  securityLogger("SECURITY_EVENTS_CLEANUP"),
  catchAsync(async (req, res, next) => {
    const user = req.user as any;
    if (user.user_type !== 'superadmin') {
      return next(new AppError("Insufficient permissions", HTTP_CODES.FORBIDDEN));
    }

    const { daysToKeep = 7 } = req.body;
    
    securityService.clearOldEvents(Number(daysToKeep));
    
    res.status(HTTP_CODES.OK).json(
      new APIResponse("success", `Security events older than ${daysToKeep} days have been cleared`)
    );
  })
);

export default router; 