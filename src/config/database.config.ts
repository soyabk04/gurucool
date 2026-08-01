import mongoose from "mongoose";
import { mongoUrl } from "./env.config.js";

export const dbConnect=async()=>{
try{    
    await mongoose.connect(mongoUrl);
    console.log("Database connected successfully");}
catch(error:any){
    console.error("Database connection error: " + error.message);
    process.exit(1); // Exit the process with an error code if the connection fails
}
}

