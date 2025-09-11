import express from "express"
import {addPortfolioFund} from "../../controllers/portfolio/addPortfolio.js"
import { isAuthenticated } from "../../middlewares/auth.js"


const router=express.Router()

router.post("/add",isAuthenticated,addPortfolioFund)


export default router;