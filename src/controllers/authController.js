import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import sendToken from "../helpers/sendToken.js";

export const registerUser = async (req, res) => {

    try {

        const { name, email, password } = req.body

        const existingEmail = await User.findOne({ email })
        if (existingEmail) {
            return res.status(400).json({ success: false, message: 'User already exists..please proceed with login' })
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const createUser = new User({
            name: name,
            email: email,
            role: 'user',
            password: hashedPassword
        })

        await createUser.save()
        console.log("user created sucessfully:", createUser)

        sendToken(createUser, 201, res)

    } catch (error) {
        console.log('err while registration',error.message)
        res.status(500).json({
            success: false,
            message: 'error occured while registration:' + error.message
        })
    }


}



export const loginUser = async (req, res) => {

    try {

        const { email, password } = req.body
        console.log("parsed body: ", req.body)

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "email and password are required" })
        }

        const user = await User.findOne({ email }).select("+password");
        console.log('userData:', user)
        if (!user) {
            return res.status(400).json({ success: false, message: "invalid credentials" })
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password)
        if (!isPasswordMatch) {
            return res.status(400).json({ success: false, message: "Incorrect password or password dosen't match" })
        }

        sendToken(user, 200, res)

    } catch (error) {
        console.log('error while trying to login: ' + error.message)
        res.status(500).json({
            success: false,
            message: "error occured during login:",
            error: error.message
        })
    }


}