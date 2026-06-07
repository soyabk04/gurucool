import mongoose from "mongoose";

export const dbConnect=async()=>{
try{    
    await mongoose.connect("mongodb://admin:password@localhost:27017/mydb?authSource=admin");
    console.log("Database connected successfully");}
catch(error:any){
    console.error("Database connection error: " + error.message);
    process.exit(1); // Exit the process with an error code if the connection fails
}
}

