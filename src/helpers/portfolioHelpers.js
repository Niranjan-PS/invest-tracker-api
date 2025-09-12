import mongoose from "mongoose"
import Portfolio from "../models/portfolioModel.js"
import HttpStatus from "./httpStatusCodes.js"


 export const getUserPortfolioRecords = async (req, res) => {
  try {
    const userId = req.user?._id
    console.log("User ID:", userId)

    if (!userId) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: "User not authenticated or invalid user ID",
      })
    }

    const portfolioRecords = await Portfolio.find({ userId: new mongoose.Types.ObjectId(userId) })
      
      
    console.log("Portfolio Records:", portfolioRecords)

    if (!portfolioRecords || portfolioRecords.length === 0) {
      return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: "No portfolio records found for this user",
      })
    }

    return portfolioRecords;
  } catch (error) {
    console.error("Error while fetching portfolio records:", error.message)
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error fetching portfolio records",
      error: error.message,
    })
  }
}




export const validateUserAndSchemeCode = (userId, schemeCode) => {
  if (!userId || !schemeCode) {
    return { valid: false, message: "User ID and scheme code are required" }
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return { valid: false, message: "Invalid User ID format" }
  }

  if (typeof schemeCode !== "string" || schemeCode.trim() === "") {
    return { valid: false, message: "Invalid scheme code" }
  }

  return { valid: true }
}