
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 100, 
  keyGenerator: (req) => req.user ? req.user.id : req.ip,
  message: { success: false, message: 'Too many requests from this user/IP' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5, 
  message: { success: false, message: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const portfolioUpdateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 10, 
  keyGenerator: (req) => req.user ? req.user.id : req.ip, 
  message: { success: false, message: 'Too many portfolio updates, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
})


export const fundLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 50, 
  keyGenerator: (req) => req.user ? req.user.id : req.ip, 
  message: { success: false, message: 'Too many fund requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
})

