import dotenv from "dotenv"
import mongoose from "mongoose";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path: './.env'
})

connectDB()
.then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`Server is Running at PORT: ${process.env.PORT}`);
        
    })
})
.catch((err) => console.log('MONDODB connection Failed'))