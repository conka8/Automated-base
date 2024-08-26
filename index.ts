import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from 'path';

import { BACKEND_PORT } from "./config";
import http from "http";
import { BACKEND_URL, FRONTEND_URL } from "./config/config";
// import { UserRouter } from "./routes";
// import TokenRouter from "./routes/TokenRoute";

// Load environment variables from .env file
dotenv.config();

// Create an instance of the Express applications
const app = express();

// Set up Cross-Origin Resource Sharing (CORS) options
// Configure CORS to allow requests from your frontend domain
const whitelist = [FRONTEND_URL, BACKEND_URL];
const corsOptions = {
  origin: function (origin: any, callback: any) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};
app.use(express.json());
// { extended: false }
app.use(cors(corsOptions));

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, './public')));

// Parse incoming JSON requests using body-parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

const server = http.createServer(app);

// Define routes for different API endpoints
// app.use("/api/users", UserRouter);
// app.use("/api/tokens", TokenRouter);

// Define a route to check if the backend server is running
app.get("/", async (req: any, res: any) => {
  res.send("Backend Server is Running now!");
});

// Start the Express server to listen on the specified port
server.listen(BACKEND_PORT, () => {
  console.log(`Server is running on port ${BACKEND_PORT}`);
});