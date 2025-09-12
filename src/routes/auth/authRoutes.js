import express from "express"
import { registerUser,loginUser} from "../../controllers/userAuthController/userAuth.js"
import { validateRegister, checkValidationResult, validateLogin } from "../../helpers/validation.js"
import { loginLimiter}from '../../utils/rateLimiter.js'
const router=express.Router()

router.post('/signup',validateRegister,checkValidationResult,registerUser)
router.post('/login',validateLogin,loginLimiter,checkValidationResult,loginUser)






export default router