import mongoose from "mongoose";

const latestFundNavSchema = new mongoose.Schema({

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

    updatedAt: {
        type: Date,
        default: Date.now
    },
});

export default mongoose.model("LatestFundNAV", latestFundNavSchema)