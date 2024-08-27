import { PublicKey } from '@solana/web3.js';
import { config } from 'dotenv'
import fs from 'fs';
import { Liquidity, LiquidityPoolKeys, LiquidityStateV4, Market, MARKET_STATE_LAYOUT_V3 } from '@raydium-io/raydium-sdk';
import { connection, RAYDIUM_LIQUIDITY_PROGRAM_ID_V4 } from '../config/config';

config()


/**
 * @func loadVar
 * @description 'load variable in .env'
 * @param variableName: string 'VAR'
 */
export const loadVar = (variableName: string) => {
    const variable = process.env[variableName] || '';
    if (!variable) {
        console.log(`${variableName} is not set`);
        process.exit(1);
    }
    return variable;
};

/**
 * @func readJson
 * @description 'read json file'
 * @param filename: string = "data.json" 
 */
export function readJson(filename: string = "data.json"): string[] {
    if (!fs.existsSync(filename)) {
        // If the file does not exist, create an empty array
        fs.writeFileSync(filename, '[]', 'utf-8');
    }
    const data = fs.readFileSync(filename, 'utf-8');
    return JSON.parse(data) as string[];
}


/**
 * @func writeJson
 * @description 'write json file'
 * @param data: Data[] 'params0'
 * @param filename: string = "data.json" 
 * @param  'params2'
 */
export function writeJson(data: string[], filename: string = "data.json",): void {
    fs.writeFileSync(filename, JSON.stringify(data, null, 4), 'utf-8');
}


/**
 * @func createPoolKeys
 * @description 'get pool keys'
 * @param id: PublicKey,
 * @param accountData: LiquidityStateV4,
 */
export async function createPoolKeys(
    id: PublicKey,
    accountData: LiquidityStateV4,
): Promise<LiquidityPoolKeys> {
    const marketId = accountData.marketId
    const marketAccountInfo = await connection.getAccountInfo(marketId, "processed");

    if (!marketAccountInfo) {
        throw new Error('Failed to fetch market info for market id ' + marketId.toBase58());
    }

    const { bids, asks, eventQueue } = MARKET_STATE_LAYOUT_V3.decode(marketAccountInfo.data);

    return {
        id,
        baseMint: accountData.baseMint,
        quoteMint: accountData.quoteMint,
        lpMint: accountData.lpMint,
        baseDecimals: accountData.baseDecimal.toNumber(),
        quoteDecimals: accountData.quoteDecimal.toNumber(),
        lpDecimals: 5,
        version: 4,
        programId: RAYDIUM_LIQUIDITY_PROGRAM_ID_V4,
        authority: Liquidity.getAssociatedAuthority({
            programId: RAYDIUM_LIQUIDITY_PROGRAM_ID_V4,
        }).publicKey,
        openOrders: accountData.openOrders,
        targetOrders: accountData.targetOrders,
        baseVault: accountData.baseVault,
        quoteVault: accountData.quoteVault,
        marketVersion: 3,
        marketProgramId: accountData.marketProgramId,
        marketId: accountData.marketId,
        marketAuthority: Market.getAssociatedAuthority({
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
        lookupTableAccount: PublicKey.default,
    };
}
