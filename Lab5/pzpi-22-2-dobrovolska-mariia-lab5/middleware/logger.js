// Request logging middleware

const requestLogger = (req, res, next) => {
  const start = Date.now();
  const { method, url, ip } = req;
  const userAgent = req.get('User-Agent') || 'Unknown';
  
  // Get user ID if authenticated
  const userId = req.user ? req.user.id : 'Anonymous';
  
  console.log(`📥 ${method} ${url} - ${ip} - User: ${userId}`);
  
  // Log request body for non-GET requests (excluding sensitive data)
  if (method !== 'GET' && req.body) {
    const logBody = { ...req.body };
    // Remove sensitive fields from logs
    delete logBody.password;
    delete logBody.currentPassword;
    delete logBody.newPassword;
    
    if (Object.keys(logBody).length > 0) {
      console.log(`📄 Request Body:`, JSON.stringify(logBody, null, 2));
    }
  }
  
  // Override res.json to log responses
  const originalJson = res.json;
  res.json = function(body) {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    
    // Determine emoji based on status code
    let emoji = '✅';
    if (statusCode >= 400 && statusCode < 500) emoji = '⚠️';
    if (statusCode >= 500) emoji = '❌';
    
    console.log(`📤 ${emoji} ${method} ${url} - ${statusCode} - ${duration}ms - User: ${userId}`);
    
    // Log error responses
    if (statusCode >= 400 && body.error) {
      console.log(`🔍 Error Details:`, body.error);
    }
    
    return originalJson.call(this, body);
  };
  
  next();
};

// API Analytics middleware
const apiAnalytics = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, url } = req;
    const statusCode = res.statusCode;
    const userId = req.user ? req.user.id : null;
    
    // Log slow requests (>1000ms)
    if (duration > 1000) {
      console.log(`🐌 SLOW REQUEST: ${method} ${url} - ${duration}ms`);
    }
    
    // Log API usage statistics
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 API Stats: ${method} ${url} | ${statusCode} | ${duration}ms | User: ${userId || 'Anonymous'}`);
    }
  });
  
  next();
};

// Security logging middleware
const securityLogger = (req, res, next) => {
  const { method, url, ip } = req;
  const userAgent = req.get('User-Agent') || 'Unknown';
  
  // Log potentially suspicious requests
  const suspiciousPatterns = [
    /\/admin/i,
    /\.php$/i,
    /\.asp$/i,
    /\/wp-/i,
    /\/etc\/passwd/i,
    /\.\./,
    /<script/i,
    /union.*select/i
  ];
  
  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(url) || pattern.test(req.get('User-Agent') || '')
  );
  
  if (isSuspicious) {
    console.log(`🚨 SUSPICIOUS REQUEST: ${method} ${url} from ${ip}`);
    console.log(`🕵️ User-Agent: ${userAgent}`);
  }
  
  // Log failed authentication attempts
  if (url.includes('/auth/login') && method === 'POST') {
    res.on('finish', () => {
      if (res.statusCode === 401) {
        console.log(`🔐 FAILED LOGIN ATTEMPT: ${req.body?.email || 'Unknown'} from ${ip}`);
      }
    });
  }
  
  next();
};

// Rate limiting logger
const rateLimitLogger = (req, res, next) => {
  // Log when rate limit is hit
  res.on('finish', () => {
    if (res.statusCode === 429) {
      console.log(`⏱️ RATE LIMIT HIT: ${req.ip} - ${req.method} ${req.url}`);
    }
  });
  
  next();
};

module.exports = {
  requestLogger,
  apiAnalytics,
  securityLogger,
  rateLimitLogger
};