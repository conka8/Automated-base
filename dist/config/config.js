"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RAYDIUM_LIQUIDITY_PROGRAM_ID_V4 = exports.OPENBOOK_PROGRAM_ID = exports.connection = exports.MONGO_URL = exports.BACKEND_URL = exports.FRONTEND_URL = exports.BACKEND_PORT = void 0;
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const web3_js_1 = require("@solana/web3.js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
try {
    dotenv_1.default.config();
}
catch (error) {
    console.error("Error loading environment variables:", error);
    process.exit(1);
}
exports.BACKEND_PORT = process.env.PORT || 5000;
exports.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
exports.BACKEND_URL = process.env.BACKEND_URL || 'https://localhost:5000';
exports.MONGO_URL = process.env.MONGO_URL || '';
// export const JWT_SECRET = process.env.JWT_SECRET || "JWT_SECRET";
exports.connection = new web3_js_1.Connection(process.env.MAIN_RPC || (0, web3_js_1.clusterApiUrl)("mainnet-beta"), "processed");
exports.OPENBOOK_PROGRAM_ID = raydium_sdk_1.MAINNET_PROGRAM_ID.OPENBOOK_MARKET;
exports.RAYDIUM_LIQUIDITY_PROGRAM_ID_V4 = raydium_sdk_1.MAINNET_PROGRAM_ID.AmmV4;
