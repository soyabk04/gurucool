import mongoose from "mongoose";

export const dbConnect=async()=>{
try{    
    const mongourl=process.env.MONGOURL!
    await mongoose.connect(mongourl);
    console.log("Database connected successfully");}
catch(error:any){
    console.error("Database connection error: " + error.message);
    process.exit(1); // Exit the process with an error code if the connection fails
}
}

