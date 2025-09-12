import express from "express"
import {addPortfolioFund,getPortfolioValue,getNAVhistory,getPortfolioList,removePortfolioFund} from "../../controllers/portfolioController/portfolio.js"
import { isAuthenticated } from "../../middlewares/auth.js"
import { validateAddFund, validateRemoveFund, validatePortfolioValue,validateNAVHistory, checkValidationResult } from "../../helpers/validation.js"
import { portfolioUpdateLimiter}from '../../utils/rateLimiter.js'


const router=express.Router()

router.post("/add",isAuthenticated,portfolioUpdateLimiter,validateAddFund,checkValidationResult,addPortfolioFund)
router.get('/value',isAuthenticated,validatePortfolioValue,checkValidationResult,getPortfolioValue)
router.get('/history',isAuthenticated,validateNAVHistory,checkValidationResult,getNAVhistory)
router.get('/list',isAuthenticated,getPortfolioList)
router.delete('/remove/:schemeCode',isAuthenticated,portfolioUpdateLimiter,validateRemoveFund,checkValidationResult,removePortfolioFund)


export default router;