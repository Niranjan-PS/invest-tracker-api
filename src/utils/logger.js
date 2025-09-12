import fs from "fs";
import path from "path";
import morgan from "morgan";

const logStream = fs.createWriteStream(path.join(process.cwd(), "view.logs"), { flags: "a" })

const getLoggerMiddleware = () => {
  if (process.env.NODE_ENV === "production") {
    return morgan("combined", { stream: logStream })
  }
  return morgan("dev")
};

export default getLoggerMiddleware
