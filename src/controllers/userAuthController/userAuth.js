import User from "../../models/userModel.js";
import sendToken from "../../helpers/sendToken.js";
import HttpStatus from "../../helpers/httpStatusCodes.js"
import { validateRegister, validateLogin, checkValidationResult } from "../../helpers/validation.js"
export const registerUser = async (req, res) => {

    try {

        checkValidationResult(req, res, () => {})

        const { name, email, password } = req.body

        const existingEmail = await User.findOne({ email })
        if (existingEmail) {
            return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: 'User already exists..please proceed with login' })
        }

        const createUser = new User({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            role: 'user',
            password,
        })

        await createUser.save()
        sendToken(createUser, HttpStatus.CREATED, res)

    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'error occured while registration:' + error.message
        })
    }

}


export const loginUser = async (req, res) => {

    try {

        checkValidationResult(req, res, () => {})

        const { email, password } = req.body
        console.log("parsed body: ", req.body)

        if (!email || !password) {
            return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: "email and password are required" })
        }

        const user = await User.findOne({ email:email.trim().toLowerCase() }).select("+password");
        console.log('userData:', user)
        if (!user) {
            return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: "invalid credentials" })
        }

        const isPasswordMatch = await user.comparePassword(password)
        if (!isPasswordMatch) {
            return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: "Incorrect password or password dosen't match" })
        }

        sendToken(user, HttpStatus.OK, res)

    } catch (error) {
        console.log('error while trying to login: ' + error.message)
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "error occured during login:",
            error: error.message
        })
    }


}