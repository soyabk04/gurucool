import express from 'express';
import type { Request,Response,NextFunction } from 'express';
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { port,version } from './config/env.config.js';
import { dbConnect } from './config/database.config.js';
import userRouter from './routes/user.route.js';
import courseRouter from './routes/course.route.js';
import cors from "cors";
import { organizationRouter } from './routes/organization.route.js';
import { analyticsRouter } from './routes/analytics.routes.js';

dotenv.config();

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json()); // Middleware to parse JSON bodies




app.use(`/api/auth`, userRouter); // Import and use user routes
app.use('/api/courses', courseRouter); // Import and use course routes
app.use('/api/organization', organizationRouter);
app.use('/api/analytics', analyticsRouter);




app.listen(port, async () => {
    console.log(`Server is running on port ${port}`);
    await dbConnect();
});