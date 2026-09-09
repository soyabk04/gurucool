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
import {getDomains} from './services/organization.service.js'
import { startChapterUnlockCron } from "./cron/chapterUnlock.cron.js";
import { getDomainsRedis } from './utils/domainCors.js';
dotenv.config();
await dbConnect();


const app = express();
app.set("trust proxy", 1);
const domains=await getDomains()


app.use(
  cors({
    
    async origin(origin,  callback) {
      try {
        if (!origin) {
          return callback(null, true);
        }

        const hostname = new URL(origin).hostname.toLowerCase();
                let allowedDomains= await getDomainsRedis(domains.data);
                allowedDomains?.data.push("soyab-dev.in","localhost","gurucool-frontend-git-main-soyabs-projects-e9a605b5.vercel.app")
                const allowedOrigins = (allowedDomains).data.map((d:any) =>
          d.toLowerCase().trim()
       );;
            
        if (allowedOrigins.includes(hostname)) {
          return callback(null, true);
        }

        callback(new Error("Not allowed by CORS"));
      }catch (err) {
        callback(err as Error);
      }
    },
    credentials: true,
  })
);
startChapterUnlockCron();
app.use(cookieParser());
app.use(express.json()); // Middleware to parse JSON bodies
app.use("/api/auth", userRouter); // Import and use user routes
app.use('/api/courses', courseRouter); // Import and use course routes
app.use('/api/organization', organizationRouter);
app.use('/api/analytics', analyticsRouter);




app.use(errorMiddleware)

app.listen(port, async () => {
    console.log(`Server is running on port ${port}`);
    
});
