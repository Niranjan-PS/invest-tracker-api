
import HttpStatus from "../helpers/httpStatusCodes.js"

const errorHandler = (err, req, res, next) => {
  console.error(err)

  const statusCode = err.statusCode || HttpStatus.INTERNAL_SERVER_ERROR
  const message = err.message || "Internal Server Error"

  const response = {
    success: false,
    message,
  }

  
  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack
  }

  res.status(statusCode).json(response)
}

export default errorHandler
