import mongoose from "mongoose";

const historyFundSchema = new mongoose.Schema({
    schemeCode: {
        type: Number,
        required: true
    },
    nav: {
        type: Number,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});

export default mongoose.model("HistoryFundNAV", historyFundSchema)