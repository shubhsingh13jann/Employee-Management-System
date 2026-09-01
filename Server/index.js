import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";
import { adminRouter } from "./Routes/AdminRoute.js";

const app = express()
app.use(cors({
    origin:["http://localhost:5173"],
    methods:['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())
app.use('/auth', adminRouter)
app.listen(3000, ()=>{
    console.log("Server is Running")
})




// !This code sets up a basic Express.js server in Node.js that connects your frontend (likely running on Vite at localhost:5173) 
// !to backend routes (like login, add category, etc.). Let’s go through what each part does: