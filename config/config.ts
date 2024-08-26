import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import dotenv from "dotenv";
dotenv.config();

try {
  dotenv.config();
} catch (error) {
  console.error("Error loading environment variables:", error);
  process.exit(1);
}

export const BACKEND_PORT = process.env.PORT || 5000
export const FRONTEND_URL = process.env.PORT || 'http://localhost:5173'
export const BACKEND_URL = process.env.PORT || 'https://localhost:5000'
// export const JWT_SECRET = process.env.JWT_SECRET || "JWT_SECRET";

const connection = new Connection("https://mainnet.helius-rpc.com/?api-key=e5ab7f1b-b786-43cc-8735-67f20399f3d9")
