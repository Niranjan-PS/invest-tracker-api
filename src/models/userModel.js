import mongoose, { Mongoose } from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: [true, "Please Enter The Name"],
        trim: true,
        minLength: [2, "Name must include atleast 2 characters"],
        maxLength: [20, "Name dosen't go over 20 characters"]
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
        type: String,
        required: [true, 'Please enter valid password'],
        minLength: [8, 'Password must be at least 8 characters'],
        select: false
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLoginAt: {
        type: Date,

    },
},

    {
        timestamps: {
            createdAt: "registeredAt",
            updatedAt: "lastUpdatedAt",
        }
    })



    userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next()
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next()
  } catch (error) {
    next(error)
  }
})

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

userSchema.index({email:1})
export default mongoose.model("User", userSchema)