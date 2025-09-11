import mongoose from "mongoose";

const portfolioSchema = new mongoose.Schema({
    userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User ID is required"],
  },
  schemeCode: {
    type: Number,
    required: [true, "Scheme Code is required"],
  },
  units: {
    type: Number,
    required: [true, "Units are required"],
    min: [0, "Units cannot be negative"],
  },
  purchaseDate: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})


portfolioSchema.index({userId:1,schemeCode:1})
const Portfolio = mongoose.model("Portfolio", portfolioSchema);
export default Portfolio