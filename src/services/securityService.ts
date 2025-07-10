import { Request } from "express";
import userModel from "../models/user";

export interface SecurityEvent {
  event: string;
  timestamp: string;
  ip: string;
  userAgent?: string;
  userId?: string;
  email?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: any;
  url?: string;
  method?: string;
}

export interface SecurityMetrics {
  totalLoginAttempts: number;
  failedLoginAttempts: number;
  lockedAccounts: number;
  suspiciousIps: string[];
  recentSecurityEvents: SecurityEvent[];
}

class SecurityService {
  private securityEvents: SecurityEvent[] = [];
  private maxEventsToStore = 1000;
  private suspiciousActivityThresholds = {
    maxFailedLoginsPerHour: 10,
    maxRequestsPerMinute: 60,
    maxPasswordResetRequestsPerHour: 5,
  };

  // A09: Security Logging and Monitoring
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // Add to in-memory store (in production, use proper logging system)
      this.securityEvents.unshift(event);
      
      // Keep only recent events
      if (this.securityEvents.length > this.maxEventsToStore) {
        this.securityEvents = this.securityEvents.slice(0, this.maxEventsToStore);
      }

      // Log to console (in production, send to SIEM/security monitoring system)
      console.log(`SECURITY_EVENT: ${JSON.stringify(event)}`);

      // Alert on critical events
      if (event.severity === 'CRITICAL') {
        await this.handleCriticalSecurityEvent(event);
      }

      // Store in database for audit trail (implement based on requirements)
      // await this.storeSecurityEventInDB(event);
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }

  // Create security event from request
  createSecurityEvent(
    eventType: string,
    req: Request,
    severity: SecurityEvent['severity'] = 'LOW',
    additionalDetails: any = {}
  ): SecurityEvent {
    return {
      event: eventType,
      timestamp: new Date().toISOString(),
      ip: this.getClientIP(req),
      userAgent: req.get('User-Agent'),
      userId: (req.user as any)?.id || null,
      email: req.body?.email || (req.user as any)?.email || null,
      severity,
      url: req.url,
      method: req.method,
      details: {
        ...additionalDetails,
        headers: this.sanitizeHeaders(req.headers),
      }
    };
  }

  // A09: Monitor for suspicious activities
  async detectSuspiciousActivity(ip: string): Promise<boolean> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const recentEvents = this.securityEvents.filter(
      event => event.ip === ip && new Date(event.timestamp) > oneHourAgo
    );

    const failedLogins = recentEvents.filter(
      event => event.event === 'LOGIN_FAILED'
    ).length;

    const passwordResetRequests = recentEvents.filter(
      event => event.event === 'PASSWORD_RESET_REQUEST'
    ).length;

    // Check if activity exceeds thresholds
    if (failedLogins > this.suspiciousActivityThresholds.maxFailedLoginsPerHour) {
      await this.logSecurityEvent({
        event: 'SUSPICIOUS_ACTIVITY_DETECTED',
        timestamp: new Date().toISOString(),
        ip,
        severity: 'HIGH',
        details: {
          reason: 'Excessive failed login attempts',
          count: failedLogins,
          timeframe: '1 hour'
        }
      });
      return true;
    }

    if (passwordResetRequests > this.suspiciousActivityThresholds.maxPasswordResetRequestsPerHour) {
      await this.logSecurityEvent({
        event: 'SUSPICIOUS_ACTIVITY_DETECTED',
        timestamp: new Date().toISOString(),
        ip,
        severity: 'HIGH',
        details: {
          reason: 'Excessive password reset requests',
          count: passwordResetRequests,
          timeframe: '1 hour'
        }
      });
      return true;
    }

    return false;
  }

  // A09: Get security metrics for monitoring dashboard
  async getSecurityMetrics(): Promise<SecurityMetrics> {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentEvents = this.securityEvents.filter(
      event => new Date(event.timestamp) > last24Hours
    );

    const loginAttempts = recentEvents.filter(
      event => event.event === 'LOGIN_ATTEMPT'
    );

    const failedLogins = recentEvents.filter(
      event => event.event === 'LOGIN_FAILED'
    );

    const suspiciousIps = [...new Set(
      recentEvents
        .filter(event => event.severity === 'HIGH' || event.severity === 'CRITICAL')
        .map(event => event.ip)
    )];

    // Get locked accounts count (this would query the database)
    const lockedAccounts = 0; // Implement based on your needs

    return {
      totalLoginAttempts: loginAttempts.length,
      failedLoginAttempts: failedLogins.length,
      lockedAccounts,
      suspiciousIps,
      recentSecurityEvents: recentEvents.slice(0, 50)
    };
  }

  // A01: Access Control Monitoring
  async logAccessControlEvent(
    userId: string,
    resource: string,
    action: string,
    allowed: boolean,
    req: Request
  ): Promise<void> {
    const event = this.createSecurityEvent(
      'ACCESS_CONTROL_CHECK',
      req,
      allowed ? 'LOW' : 'MEDIUM',
      {
        userId,
        resource,
        action,
        allowed,
        reason: allowed ? 'Access granted' : 'Access denied'
      }
    );

    await this.logSecurityEvent(event);
  }

  // A03: Injection Attack Detection
  async logPotentialInjectionAttempt(
    req: Request,
    attackType: string,
    payload: string
  ): Promise<void> {
    const event = this.createSecurityEvent(
      'INJECTION_ATTEMPT_DETECTED',
      req,
      'HIGH',
      {
        attackType,
        payload: payload.substring(0, 100), // Limit payload size in logs
        blocked: true
      }
    );

    await this.logSecurityEvent(event);
  }

  // A08: File Upload Security Events
  async logFileUploadEvent(
    req: Request,
    filename: string,
    fileType: string,
    fileSize: number,
    status: 'SUCCESS' | 'BLOCKED' | 'ERROR',
    reason?: string
  ): Promise<void> {
    const event = this.createSecurityEvent(
      'FILE_UPLOAD',
      req,
      status === 'BLOCKED' ? 'MEDIUM' : 'LOW',
      {
        filename,
        fileType,
        fileSize,
        status,
        reason
      }
    );

    await this.logSecurityEvent(event);
  }

  // Handle critical security events
  private async handleCriticalSecurityEvent(event: SecurityEvent): Promise<void> {
    // In production, implement:
    // 1. Send alerts to security team
    // 2. Trigger automated response (e.g., temporary IP blocking)
    // 3. Create incident tickets
    // 4. Send notifications to monitoring systems

    console.warn(`🚨 CRITICAL SECURITY EVENT: ${event.event}`, event);
    
    // Example: Log multiple failed attempts from same IP
    if (event.event === 'MULTIPLE_FAILED_LOGINS') {
      console.warn(`🔒 Consider implementing temporary IP blocking for: ${event.ip}`);
    }
  }

  // Get client IP address (considering proxies)
  private getClientIP(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'] as string;
    const realIP = req.headers['x-real-ip'] as string;
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (realIP) {
      return realIP;
    }
    
    return req.ip || req.connection.remoteAddress || 'unknown';
  }

  // Sanitize headers for logging (remove sensitive information)
  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    
    // Remove sensitive headers
    delete sanitized.authorization;
    delete sanitized.cookie;
    delete sanitized['x-api-key'];
    delete sanitized['x-auth-token'];
    
    return sanitized;
  }

  // Get recent security events for a specific IP
  getRecentEventsByIP(ip: string, hours: number = 24): SecurityEvent[] {
    const timeThreshold = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return this.securityEvents.filter(
      event => event.ip === ip && new Date(event.timestamp) > timeThreshold
    );
  }

  // Clear old security events (for memory management)
  clearOldEvents(daysToKeep: number = 7): void {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    
    this.securityEvents = this.securityEvents.filter(
      event => new Date(event.timestamp) > cutoffDate
    );
  }
}

// Export singleton instance
export const securityService = new SecurityService();
export default SecurityService; 