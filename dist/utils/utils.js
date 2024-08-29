"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadVar = void 0;
exports.readJson = readJson;
exports.writeJson = writeJson;
exports.createPoolKeys = createPoolKeys;
const web3_js_1 = require("@solana/web3.js");
const dotenv_1 = require("dotenv");
const fs_1 = __importDefault(require("fs"));
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const config_1 = require("../config/config");
(0, dotenv_1.config)();
/**
 * @func loadVar
 * @description 'load variable in .env'
 * @param variableName: string 'VAR'
 */
const loadVar = (variableName) => {
    const variable = process.env[variableName] || '';
    if (!variable) {
        console.log(`${variableName} is not set`);
        process.exit(1);
    }
    return variable;
};
exports.loadVar = loadVar;
/**
 * @func readJson
 * @description 'read json file'
 * @param filename: string = "data.json"
 */
function readJson(filename = "data.json") {
    if (!fs_1.default.existsSync(filename)) {
        // If the file does not exist, create an empty array
        fs_1.default.writeFileSync(filename, '[]', 'utf-8');
    }
    const data = fs_1.default.readFileSync(filename, 'utf-8');
    return JSON.parse(data);
}
/**
 * @func writeJson
 * @description 'write json file'
 * @param data: Data[] 'params0'
 * @param filename: string = "data.json"
 * @param  'params2'
 */
function writeJson(data, filename = "data.json") {
    fs_1.default.writeFileSync(filename, JSON.stringify(data, null, 4), 'utf-8');
}
/**
 * @func createPoolKeys
 * @description 'get pool keys'
 * @param id: PublicKey,
 * @param accountData: LiquidityStateV4,
 */
async function createPoolKeys(id, accountData) {
    const marketId = accountData.marketId;
    const marketAccountInfo = await config_1.connection.getAccountInfo(marketId, "processed");
    if (!marketAccountInfo) {
        throw new Error('Failed to fetch market info for market id ' + marketId.toBase58());
    }
    const { bids, asks, eventQueue } = raydium_sdk_1.MARKET_STATE_LAYOUT_V3.decode(marketAccountInfo.data);
    return {
        id,
        baseMint: accountData.baseMint,
        quoteMint: accountData.quoteMint,
        lpMint: accountData.lpMint,
        baseDecimals: accountData.baseDecimal.toNumber(),
        quoteDecimals: accountData.quoteDecimal.toNumber(),
        lpDecimals: 5,
        version: 4,
        programId: config_1.RAYDIUM_LIQUIDITY_PROGRAM_ID_V4,
        authority: raydium_sdk_1.Liquidity.getAssociatedAuthority({
            programId: config_1.RAYDIUM_LIQUIDITY_PROGRAM_ID_V4,
        }).publicKey,
        openOrders: accountData.openOrders,
        targetOrders: accountData.targetOrders,
        baseVault: accountData.baseVault,
        quoteVault: accountData.quoteVault,
        marketVersion: 3,
        marketProgramId: accountData.marketProgramId,
        marketId: accountData.marketId,
        marketAuthority: raydium_sdk_1.Market.getAssociatedAuthority({
            programId: accountData.marketProgramId,
            marketId: accountData.marketId,
        }).publicKey,
        marketBaseVault: accountData.baseVault,
        marketQuoteVault: accountData.quoteVault,
        marketBids: bids,
        marketAsks: asks,
        marketEventQueue: eventQueue,
        withdrawQueue: accountData.withdrawQueue,
        lpVault: accountData.lpVault,
        lookupTableAccount: web3_js_1.PublicKey.default,
    };
}
