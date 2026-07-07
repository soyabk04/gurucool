import express from 'express';
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { port,version } from './config/env.config.js';
import { dbConnect } from './config/database.config.js';
import userRouter from './routes/user.route.js';
import courseRouter from './routes/course.route.js';
import cors from "cors";
import { organizationRouter } from './routes/organization.route.js';
import { analyticsRouter } from './routes/analytics.routes.js';
import {getOrganizationUsersService} from "./services/organization.service.js"
dotenv.config();

const app = express();
const allowedOrigins = [
  "http://localhost:5173",
  "https://soyab-dev.in",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header (e.g. Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
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