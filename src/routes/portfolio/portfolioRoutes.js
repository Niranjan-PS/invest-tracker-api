import express from "express"
import {addPortfolioFund,getPortfolioValue} from "../../controllers/portfolio/portfolio.js"
import { isAuthenticated } from "../../middlewares/auth.js"


const router=express.Router()

router.post("/add",isAuthenticated,addPortfolioFund)
router.get('/value',isAuthenticated,getPortfolioValue)


export default router;