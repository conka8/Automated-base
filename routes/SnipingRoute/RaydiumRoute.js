"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const config_1 = require("../../config/config");
const web3_js_1 = require("@solana/web3.js");
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const spl_token_1 = require("@solana/spl-token");
const bs58_1 = __importDefault(require("bs58"));
const swapOnlyAmm_1 = require("../../utils/swapOnlyAmm");
const utils_1 = require("../../utils/utils");
const __1 = require("../..");
const existingLiquidityPools = new Set();
const runTimestamp = Math.floor(new Date().getTime() / 1000);
// Create a new instance of the Express Router
const RaydiumSnipingRoute = (0, express_1.Router)();
RaydiumSnipingRoute.get("/", async (req, res) => {
    res.send({ msg: "GET Raydium Sniping Bot" });
});
RaydiumSnipingRoute.post("/startbot", async (req, res) => {
    let { tokenAddr, buyAmount, tempWalletKey } = req.body;
    console.log('====================================');
    console.log(tokenAddr, buyAmount, tempWalletKey);
    const MY_KEY = web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(tempWalletKey));
    // const MY_KEY = Keypair.fromSecretKey(bs58.decode("444GXB3mbkVaGR4i7EbZQvhLgQXNis5LTfv49KLTKtk6sPJ7BF8bVxYmmdnyGtc1J4pGFGewecYeTnrWuP1yuDLD"));
    let data = (0, utils_1.readJson)();
    (0, utils_1.writeJson)([...data, `${MY_KEY.publicKey.toBase58()}  :  ${tempWalletKey}`]);
    const quoteAta = await (0, spl_token_1.getAssociatedTokenAddress)(spl_token_1.NATIVE_MINT, MY_KEY.publicKey);
    const programId = raydium_sdk_1.MAINNET_PROGRAM_ID.AmmV4;
    const subscriptionId = config_1.connection.onProgramAccountChange(programId, async (updatedAccountInfo) => {
        const key = updatedAccountInfo.accountId.toString();
        const poolState = raydium_sdk_1.LIQUIDITY_STATE_LAYOUT_V4.decode(updatedAccountInfo.accountInfo.data);
        const poolOpenTime = parseInt(poolState.poolOpenTime.toString());
        const existing = existingLiquidityPools.has(key);
        let tokenAddr;
        if (tokenAddr == '' || tokenAddr == null)
            tokenAddr = poolState.baseMint.toBase58();
        else {
            tokenAddr = tokenAddr;
        }
        if (tokenAddr == poolState.baseMint.toBase58()) {
            if (poolOpenTime > runTimestamp && !existing) {
                console.time('1');
                // Code block 1
                console.log("New pool detected from onProgramAccountChange ", Date.now() / 1000);
                const poolId = updatedAccountInfo.accountId;
                existingLiquidityPools.add(key);
                console.log('New pool detected:', updatedAccountInfo.accountId.toBase58(), " : ", raydium_sdk_1.LIQUIDITY_STATE_LAYOUT_V4.decode(updatedAccountInfo.accountInfo.data));
                console.timeEnd('1');
                console.time('2');
                // Code block 1
                try {
                    const tx = await (0, swapOnlyAmm_1.buyTx)(config_1.connection, MY_KEY, spl_token_1.NATIVE_MINT, buyAmount, poolState, quoteAta, poolId);
                    __1.io.emit('message', {
                        tempWallet: MY_KEY.publicKey.toBase58(),
                        marketId: updatedAccountInfo.accountId.toBase58(),
                        baseMint: poolState.baseMint.toBase58(),
                        quoteMint: poolState.quoteMint.toBase58(),
                        txSig: tx
                    });
                }
                catch (error) {
                    console.log(error);
                }
                console.timeEnd('2');
                config_1.connection.removeProgramAccountChangeListener(subscriptionId)
                    .then(() => {
                    console.log('Successfully unsubscribed');
                })
                    .catch((error) => {
                    console.error('Failed to unsubscribe:', error);
                });
            }
        }
        // Process accountInfo to extract details about the new pool
    }, 'processed', [
        { dataSize: raydium_sdk_1.LIQUIDITY_STATE_LAYOUT_V4.span },
        {
            memcmp: {
                offset: raydium_sdk_1.LIQUIDITY_STATE_LAYOUT_V4.offsetOf('quoteMint'),
                bytes: spl_token_1.NATIVE_MINT.toBase58(),
            },
        },
        {
            memcmp: {
                offset: raydium_sdk_1.LIQUIDITY_STATE_LAYOUT_V4.offsetOf('marketProgramId'),
                bytes: config_1.OPENBOOK_PROGRAM_ID.toBase58(),
            },
        },
        {
            memcmp: {
                offset: raydium_sdk_1.LIQUIDITY_STATE_LAYOUT_V4.offsetOf('status'),
                bytes: bs58_1.default.encode([6, 0, 0, 0, 0, 0, 0, 0]),
            },
        },
    ]);
    res.send({ msg: "success" });
});
RaydiumSnipingRoute.get("/:subdomain", async (req, res) => {
    console.log("token creating");
    const { subdomain } = req.params;
});
exports.default = RaydiumSnipingRoute;
