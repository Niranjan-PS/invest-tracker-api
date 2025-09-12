
import { body, param, query, validationResult } from "express-validator";
import Fund from "../models/fundModel.js"

//Auth validations
export const validateRegister = [
  body('name')
    .trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters long'),
  body('email')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(), 
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character'),
];

export const validateLogin = [
  body('email')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character'),
]

//Fund Validations
export const validateAddFund = [
  body('schemeCode')
    .isInt({ min: 1 }).withMessage('Scheme code must be a positive integer')
    .custom(async (value) => {
      const fund = await Fund.findOne({ schemeCode: value });
      if (!fund) throw new Error('Invalid scheme code - not in master fund list');
      return true;
    }),
  body('units')
    .isFloat({ min: 0.01 }).withMessage('Units must be a positive number greater than 0'),
];

export const validateRemoveFund = [
  param('schemeCode')
    .isInt({ min: 1 }).withMessage('Scheme code must be a positive integer')
    .custom(async (value) => {
      const fund = await Fund.findOne({ schemeCode: value });
      if (!fund) throw new Error('Invalid scheme code - not in master fund list');
      return true;
    }),
]


//Portfolio Validations
export const validatePortfolioValue = [
  query('asOn')
    .optional()
    .matches(/^(\d{2})-(\d{2})-(\d{4})$/)
    .withMessage('asOn must be in dd-mm-yyyy format'),
];

export const validateNAVHistory = [
  query('startDate')
    .optional()
    .matches(/^(\d{2})-(\d{2})-(\d{4})$/)
    .withMessage('startDate must be in dd-mm-yyyy format'),
  query('endDate')
    .optional()
    .matches(/^(\d{2})-(\d{2})-(\d{4})$/)
    .withMessage('endDate must be in dd-mm-yyyy format'),
];

// Fund List Validations
export const validateFetchFundList = [
  query('search')
    .optional()
    .trim()
    .escape(), 
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
];

export const validateFetchFundNAVHistory = [
  param('schemeCode')
    .isInt({ min: 1 }).withMessage('Scheme code must be a positive integer')
    .custom(async (value) => {
      const fund = await Fund.findOne({ schemeCode: value });
      if (!fund) throw new Error('Invalid scheme code - not in master fund list');
      return true;
    }),
  query('startDate')
    .optional()
    .matches(/^(\d{2})-(\d{2})-(\d{4})$/)
    .withMessage('startDate must be in dd-mm-yyyy format'),
  query('endDate')
    .optional()
    .matches(/^(\d{2})-(\d{2})-(\d{4})$/)
    .withMessage('endDate must be in dd-mm-yyyy format'),
]


export const checkValidationResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: "Validation failed", errors: errors.array() });
  }
  next();
}