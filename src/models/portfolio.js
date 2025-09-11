import mongoose from "mongoose";

const portfolioSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  fundName: {
    type: String,
    required: [true, "Fund name is required"],
    trim: true,
  },
  amount: {
    type: Number,
    required: [true, "Amount is required"],
    min: [0, "Amount cannot be negative"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

const Portfolio = mongoose.model("Portfolio", portfolioSchema);
export default Portfolio