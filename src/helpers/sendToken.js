import jwt from "jsonwebtoken"

const sendToken = (user, statusCode, res) => {

    const token=jwt.sign({
        id: user._id, role: user.role
    },
        process.env.JWT_SECRET,
        { expiresIn: '24h' },


    )

    res.cookie("token",token,{
        httpOnly:true,
        maxAge:24 * 60 * 60 * 1000,
        sameSite:"strict"
    })

res.status(statusCode).json({
    success: true,
    message: statusCode===201?"User registered successfully":"User Logged in successfully",
    token,
        user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  })
}

export default sendToken