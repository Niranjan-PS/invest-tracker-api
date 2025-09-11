import jwt from "jsonwebtoken";

export const isAuthenticated = async (req, res,next) => {
    try {

        let token = req.cookies.token
        if (!token) {
            return res.status(500).json({ success: false, message: "please login to proceed" })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (!decoded) {
            return res.status(400).json({ success: false, message: "invalid token" })

        }
        req.user = { id: decoded.id}
        next()


    } catch (error) {
        console.error("Authentication error:", error)

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ success: false, message: "Token has expired" });
        }
        return res.status(401).json({ success: false, message: "Invalid token" });
    }
}
