import express, { urlencoded } from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import authRoutes from './src/routes/auth/authRoutes.js'
import mongoConnect from './src/config/db.js'
import cookieParser from 'cookie-parser'


dotenv.config()
const app = express()
mongoConnect()


app.use(express.json())
app.use(cors())
app.use(urlencoded({ extended: true }))
app.use(cookieParser())

app.use("/api/auth", authRoutes)
app.listen(process.env.PORT, () => {
    console.log('server running successfully')
})