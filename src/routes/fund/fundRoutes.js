import express from "express"
import { fetchFundList,fetchFundNAVHistory } from "../../controllers/fundController/getFundLists.js"
import { isAuthenticated } from "../../middlewares/auth.js"

const router=express.Router()

router.get('/funds',isAuthenticated,fetchFundList)
router.get('/:schemeCode/nav',isAuthenticated,fetchFundNAVHistory)


export default router