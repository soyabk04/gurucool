import express from 'express';
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { port,version } from './config/env.config.js';
import { dbConnect } from './config/database.config.js';
import userRouter from './routes/user.route.js';
import courseRouter from './routes/course.route.js';
import cors from "cors";
import "./workers/email.worker.js";
import { organizationRouter } from './routes/organization.route.js';
import { analyticsRouter } from './routes/analytics.routes.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';
dotenv.config();

const app = express();

app.use(
  cors({

  "origin": "*",
  "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
  "preflightContinue": false,
  "optionsSuccessStatus": 204
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