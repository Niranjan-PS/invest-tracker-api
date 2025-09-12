import express, { urlencoded } from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import authRoutes from './src/routes/auth/authRoutes.js'
import portfolioRoutes from './src/routes/portfolio/portfolioRoutes.js'
import fundRoutes from './src/routes/fund/fundRoutes.js'
import mongoConnect from './src/config/db.js'
import cookieParser from 'cookie-parser'
import updateNavJob from "./src/cron/cronJob.js"
import { apiLimiter}from './src/utils/rateLimiter.js'
import getLoggerMiddleware from './src/utils/logger.js'
import errorHandler from './src/middlewares/errorHandler.js'


dotenv.config()
const app = express()
mongoConnect()

app.use(getLoggerMiddleware())
app.use(apiLimiter)

app.use(express.json())
app.use(cors())
app.use(urlencoded({ extended: true }))
app.use(cookieParser())

app.use("/api/auth", authRoutes)
app.use("/api/portfolio",portfolioRoutes)
app.use('/api/funds',fundRoutes)

app.use(errorHandler)

export default app
