import express from 'express';
import cookieParser from "cookie-parser";
import { dbConnect } from './database/mongoose.db.js';
import userRouter from './routes/user.route.js';
import courseRouter from './routes/course.route.js';
const app = express();
app.use(cookieParser());
app.use(express.json()); // Middleware to parse JSON bodies
app.use('/users', userRouter); // Import and use user routes
app.use('/courses', courseRouter); // Import and use course routes
let name1: string = 'Soyab';
app.get('/', (req, res) => {
  res.send(`Hello, ${name1}!`);
});



app.listen(3000, async () => {
    console.log('Server is running on port 3000');
    await dbConnect();
});