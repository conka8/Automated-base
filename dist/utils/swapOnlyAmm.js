"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatAmmKeysById = formatAmmKeysById;
exports.buyTx = buyTx;
exports.buy = buy;
const assert_1 = __importDefault(require("assert"));
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const utils_1 = require("./utils");
/**
 * @func getWalletTokenAccount
 * @description 'get wallet token account'
 * @param connection: Connection 'connection'
 * @param wallet: PublicKey 'my wallet'
 */
async function getWalletTokenAccount(connection, wallet) {
    const walletTokenAccount = await connection.getTokenAccountsByOwner(wallet, {
        programId: spl_token_1.TOKEN_PROGRAM_ID,
    });
    return walletTokenAccount.value.map((i) => ({
        pubkey: i.pubkey,
        programId: i.account.owner,
        accountInfo: raydium_sdk_1.SPL_ACCOUNT_LAYOUT.decode(i.account.data),
    }));
}
/**
 * @func swapOnlyAmm
 * @description 'swap'
 * @param connection: Connection 'connection'
 * @param input: TestTxInputInfo 'input'
 */
async function swapOnlyAmm(connection, input) {
    // -------- pre-action: get pool info --------
    const targetPoolInfo = await formatAmmKeysById(connection, input.targetPool);
    (0, assert_1.default)(targetPoolInfo, 'cannot find the target pool');
    const poolKeys = (0, raydium_sdk_1.jsonInfo2PoolKeys)(targetPoolInfo);
    // -------- step 1: coumpute amount out --------
    const { amountOut, minAmountOut } = raydium_sdk_1.Liquidity.computeAmountOut({
        poolKeys: poolKeys,
        poolInfo: await raydium_sdk_1.Liquidity.fetchInfo({ connection, poolKeys }),
        amountIn: input.inputTokenAmount,
        currencyOut: input.outputToken,
        slippage: input.slippage,
    });
    // -------- step 2: create instructions by SDK function --------
    const { innerTransactions } = await raydium_sdk_1.Liquidity.makeSwapInstructionSimple({
        connection,
        poolKeys,
        userKeys: {
            tokenAccounts: input.walletTokenAccounts,
            owner: input.wallet.publicKey,
        },
        amountIn: input.inputTokenAmount,
        amountOut: minAmountOut,
        fixedSide: 'in',
        makeTxVersion: raydium_sdk_1.TxVersion.V0,
        computeBudgetConfig: {
            microLamports: 120000,
            units: 100000
        }
    });
    return innerTransactions;
}
/**
 * @func formatAmmKeysById
 * @description 'format amm key'
 * @param connection: Connection 'solana connection'
 * @param id: string 'id'
 */
async function formatAmmKeysById(connection, id) {
    const account = await connection.getAccountInfo(new web3_js_1.PublicKey(id));
    if (account === null)
        throw Error(' get id info error ');
    const info = raydium_sdk_1.LIQUIDITY_STATE_LAYOUT_V4.decode(account.data);
    const marketId = info.marketId;
    const marketAccount = await connection.getAccountInfo(marketId);
    if (marketAccount === null)
        throw Error(' get market info error');
    const marketInfo = raydium_sdk_1.MARKET_STATE_LAYOUT_V3.decode(marketAccount.data);
    const lpMint = info.lpMint;
    const lpMintAccount = await connection.getAccountInfo(lpMint);
    if (lpMintAccount === null)
        throw Error(' get lp mint info error');
    const lpMintInfo = raydium_sdk_1.SPL_MINT_LAYOUT.decode(lpMintAccount.data);
    return {
        id,
        baseMint: info.baseMint.toString(),
        quoteMint: info.quoteMint.toString(),
        lpMint: info.lpMint.toString(),
        baseDecimals: info.baseDecimal.toNumber(),
        quoteDecimals: info.quoteDecimal.toNumber(),
        lpDecimals: lpMintInfo.decimals,
        version: 4,
        programId: account.owner.toString(),
        authority: raydium_sdk_1.Liquidity.getAssociatedAuthority({ programId: account.owner }).publicKey.toString(),
        openOrders: info.openOrders.toString(),
        targetOrders: info.targetOrders.toString(),
        baseVault: info.baseVault.toString(),
        quoteVault: info.quoteVault.toString(),
        withdrawQueue: info.withdrawQueue.toString(),
        lpVault: info.lpVault.toString(),
        marketVersion: 3,
        marketProgramId: info.marketProgramId.toString(),
        marketId: info.marketId.toString(),
        marketAuthority: raydium_sdk_1.Market.getAssociatedAuthority({ programId: info.marketProgramId, marketId: info.marketId }).publicKey.toString(),
        marketBaseVault: marketInfo.baseVault.toString(),
        marketQuoteVault: marketInfo.quoteVault.toString(),
        marketBids: marketInfo.bids.toString(),
        marketAsks: marketInfo.asks.toString(),
        marketEventQueue: marketInfo.eventQueue.toString(),
        lookupTableAccount: web3_js_1.PublicKey.default.toString()
    };
}
/**
 * @func buyTx
 * @description 'example func'
 * @param solanaConnection: Connection 'params0'
 * @param wallet: Keypair 'my wallet'
 * @param quoteMint: PublicKey 'token mint Id'
 * @param amount: number 'sol amount'
 * @param poolState: any 'pool state'
 * @param quoteAta: PublicKey 'quote token account'
 * @param poolId: PublicKey 'pool addr'
 */
async function buyTx(solanaConnection, wallet, quoteMint, amount, poolState, quoteAta, poolId) {
    try {
        console.log("====================================1", Math.floor((amount) * 10 ** 9));
        const totalAmount = Math.floor((amount) * 10 ** 9);
        const quoteToken = new raydium_sdk_1.Token(spl_token_1.TOKEN_PROGRAM_ID, quoteMint, 9);
        const quoteTokenAmount = new raydium_sdk_1.TokenAmount(quoteToken, totalAmount);
        const poolKeys = await (0, utils_1.createPoolKeys)(poolId, poolState);
        const baseAta = await (0, spl_token_1.getAssociatedTokenAddress)(poolState.baseMint, wallet.publicKey);
        console.log("====================================2", quoteTokenAmount);
        const { innerTransaction } = raydium_sdk_1.Liquidity.makeSwapFixedInInstruction({
            poolKeys,
            userKeys: {
                tokenAccountIn: quoteAta,
                tokenAccountOut: baseAta,
                owner: wallet.publicKey,
            },
            amountIn: quoteTokenAmount.raw,
            minAmountOut: 0,
        }, 4);
        console.log("====================================3");
        const transaction = new web3_js_1.Transaction();
        if (!await solanaConnection.getAccountInfo(quoteAta))
            transaction.add((0, spl_token_1.createAssociatedTokenAccountInstruction)(wallet.publicKey, quoteAta, wallet.publicKey, spl_token_1.NATIVE_MINT));
        transaction.add(web3_js_1.ComputeBudgetProgram.setComputeUnitLimit({ units: 150000 }), web3_js_1.ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000000 }), web3_js_1.SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: quoteAta,
            lamports: Math.floor(totalAmount - 0.00204 * 10 ** 9),
        }), (0, spl_token_1.createSyncNativeInstruction)(quoteAta, spl_token_1.TOKEN_PROGRAM_ID), (0, spl_token_1.createAssociatedTokenAccountIdempotentInstruction)(wallet.publicKey, baseAta, wallet.publicKey, poolState.baseMint), ...innerTransaction.instructions);
        transaction.feePayer = wallet.publicKey;
        transaction.recentBlockhash = (await solanaConnection.getLatestBlockhash("processed")).blockhash;
        console.log("====================================4", Math.floor(totalAmount - 0.00204 * 10 ** 9));
        const sig = await (0, web3_js_1.sendAndConfirmTransaction)(solanaConnection, transaction, [wallet], { skipPreflight: true });
        console.log(`https://solscan.io/tx/${sig}`);
        return sig;
    }
    catch (error) {
        console.log("buyTx error ", error);
    }
}
/**
 * @func getSellTx
 * @description 'get sell tx'
 * @param solanaConnection: Connection 'sol connection'
 * @param wallet: Keypair 'my wallet'
 * @param baseMint: PublicKey 'token addr'
 * @param quoteMint: PublicKey 'quote addr'
 * @param amount: string 'token amount'
 * @param targetPool: string 'target pool'
 */
async function buy(solanaConnection, wallet, baseMint, quoteMint, amount, targetPool) {
    while (true) {
        try {
            const tokenAta = await (0, spl_token_1.getAssociatedTokenAddress)(baseMint, wallet.publicKey);
            const tokenBal = await solanaConnection.getTokenAccountBalance(tokenAta);
            if (!tokenBal || tokenBal.value.uiAmount == 0) {
                return null;
            }
            const balance = tokenBal.value.amount;
            const baseToken = new raydium_sdk_1.Token(spl_token_1.TOKEN_PROGRAM_ID, baseMint, tokenBal.value.decimals);
            const quoteToken = new raydium_sdk_1.Token(spl_token_1.TOKEN_PROGRAM_ID, quoteMint, 9);
            const baseTokenAmount = new raydium_sdk_1.TokenAmount(baseToken, amount);
            const slippage = new raydium_sdk_1.Percent(99, 100);
            const walletTokenAccounts = await getWalletTokenAccount(solanaConnection, wallet.publicKey);
            const instructions = await swapOnlyAmm(solanaConnection, {
                outputToken: quoteToken,
                targetPool,
                inputTokenAmount: baseTokenAmount,
                slippage,
                walletTokenAccounts,
                wallet: wallet,
            });
            const willSendTx = (await (0, raydium_sdk_1.buildSimpleTransaction)({
                connection: solanaConnection,
                makeTxVersion: raydium_sdk_1.TxVersion.V0,
                payer: wallet.publicKey,
                innerTransactions: instructions,
                addLookupTableInfo: raydium_sdk_1.LOOKUP_TABLE_CACHE
            }))[0];
            if (willSendTx instanceof web3_js_1.VersionedTransaction) {
                willSendTx.sign([wallet]);
                return willSendTx;
            }
            continue;
        }
        catch (error) {
            return null;
        }
    }
}
