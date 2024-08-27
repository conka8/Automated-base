import { MAINNET_PROGRAM_ID } from "@raydium-io/raydium-sdk";
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
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
export const BACKEND_URL = process.env.BACKEND_URL || 'https://localhost:5000'
// export const JWT_SECRET = process.env.JWT_SECRET || "JWT_SECRET";

export const connection = new Connection(process.env.MAIN_RPC || clusterApiUrl("mainnet-beta"))
export const OPENBOOK_PROGRAM_ID = MAINNET_PROGRAM_ID.OPENBOOK_MARKET;
export const RAYDIUM_LIQUIDITY_PROGRAM_ID_V4 = MAINNET_PROGRAM_ID.AmmV4
