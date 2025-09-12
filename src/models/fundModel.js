import mongoose from "mongoose";

const fundSchema = new mongoose.Schema({

    schemeCode: {
        type: Number,
        required: true,
        unique: true
    },

    schemeName: {
        type: String,
        required: true
    },

    isinGrowth: {
        type: String,
        default:null
    },

    isinDivReinvestment: {
        type: String,
        default:null
    },

    
})

export default mongoose.model("Fund", fundSchema)