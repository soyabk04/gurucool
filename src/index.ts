import express from 'express';
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { dbConnect } from './database/mongoose.db.js';
import userRouter from './routes/user.route.js';
import courseRouter from './routes/course.route.js';
import cors from "cors";
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

app.use('/auth', userRouter); // Import and use user routes
app.use('/courses', courseRouter); // Import and use course routes




app.listen(3000, async () => {
    console.log('Server is running on port 3000');
    await dbConnect();
});