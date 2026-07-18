import express from 'express';
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { port,version } from './config/env.config.js';
import { dbConnect } from './config/database.config.js';
import userRouter from './routes/user.route.js';
import courseRouter from './routes/course.route.js';
import cors from "cors";
import "./workers/email.worker.js";
import {getVideoStreamUrl} from "./utils/getVideoUrl.js"
import { organizationRouter } from './routes/organization.route.js';
import { analyticsRouter } from './routes/analytics.routes.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';
import { getLogo } from './utils/getVideoUrl.js';
dotenv.config();

const app = express();



const allowedOrigins = [
  "http://localhost:5173", // Vite
  "http://localhost:5500",
  "http://localhost:4173", // Vite Preview (optional)
  "https://gurucool-frontend-three.vercel.app"
];

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests like Postman or curl (no Origin header)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(cookieParser());
app.use(express.json()); // Middleware to parse JSON bodies
app.use("/api/auth", userRouter); // Import and use user routes
app.use('/api/courses', courseRouter); // Import and use course routes
app.use('/api/organization', organizationRouter);
app.use('/api/analytics', analyticsRouter);




app.use(errorMiddleware)

app.listen(port, async () => {
    console.log(`Server is running on port ${port}`);
    await dbConnect();
});