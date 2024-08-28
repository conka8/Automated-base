import assert from 'assert';

import {
  jsonInfo2PoolKeys,
  Liquidity,
  LiquidityPoolKeys,
  Percent,
  Token,
  TokenAmount,
  ApiPoolInfoV4,
  LIQUIDITY_STATE_LAYOUT_V4,
  MARKET_STATE_LAYOUT_V3,
  Market,
  SPL_MINT_LAYOUT,
  SPL_ACCOUNT_LAYOUT,
  TokenAccount,
  TxVersion,
  buildSimpleTransaction,
  LOOKUP_TABLE_CACHE,
} from '@raydium-io/raydium-sdk';

import {
  PublicKey,
  Keypair,
  Connection,
  VersionedTransaction,
  SystemProgram,
  ComputeBudgetProgram,
  Transaction,
  sendAndConfirmTransaction
} from '@solana/web3.js';

import { NATIVE_MINT, TOKEN_PROGRAM_ID, createAssociatedTokenAccountIdempotentInstruction, createAssociatedTokenAccountInstruction, createSyncNativeInstruction, getAssociatedTokenAddress, getMint } from '@solana/spl-token';
import { createPoolKeys } from './utils';




type WalletTokenAccounts = Awaited<ReturnType<typeof getWalletTokenAccount>>
type TestTxInputInfo = {
  outputToken: Token
  targetPool: string
  inputTokenAmount: TokenAmount
  slippage: Percent
  walletTokenAccounts: WalletTokenAccounts
  wallet: Keypair
}


/**
 * @func getWalletTokenAccount
 * @description 'get wallet token account'
 * @param connection: Connection 'connection'
 * @param wallet: PublicKey 'my wallet'
 */
async function getWalletTokenAccount(connection: Connection, wallet: PublicKey): Promise<TokenAccount[]> {
  const walletTokenAccount = await connection.getTokenAccountsByOwner(wallet, {
    programId: TOKEN_PROGRAM_ID,
  });
  return walletTokenAccount.value.map((i) => ({
    pubkey: i.pubkey,
    programId: i.account.owner,
    accountInfo: SPL_ACCOUNT_LAYOUT.decode(i.account.data),
  }));
}


/**
 * @func swapOnlyAmm
 * @description 'swap'
 * @param connection: Connection 'connection'
 * @param input: TestTxInputInfo 'input'
 */
async function swapOnlyAmm(connection: Connection, input: TestTxInputInfo) {
  // -------- pre-action: get pool info --------
  const targetPoolInfo = await formatAmmKeysById(connection, input.targetPool)
  assert(targetPoolInfo, 'cannot find the target pool')
  const poolKeys = jsonInfo2PoolKeys(targetPoolInfo) as LiquidityPoolKeys

  // -------- step 1: coumpute amount out --------
  const { amountOut, minAmountOut } = Liquidity.computeAmountOut({
    poolKeys: poolKeys,
    poolInfo: await Liquidity.fetchInfo({ connection, poolKeys }),
    amountIn: input.inputTokenAmount,
    currencyOut: input.outputToken,
    slippage: input.slippage,
  })


  // -------- step 2: create instructions by SDK function --------
  const { innerTransactions } = await Liquidity.makeSwapInstructionSimple({
    connection,
    poolKeys,
    userKeys: {
      tokenAccounts: input.walletTokenAccounts,
      owner: input.wallet.publicKey,
    },
    amountIn: input.inputTokenAmount,
    amountOut: minAmountOut,
    fixedSide: 'in',
    makeTxVersion: TxVersion.V0,
    computeBudgetConfig: {
      microLamports: 120_000,
      units: 100_000
    }
  })
  return innerTransactions
}


/**
 * @func formatAmmKeysById
 * @description 'format amm key'
 * @param connection: Connection 'solana connection'
 * @param id: string 'id'
 */
export async function formatAmmKeysById(connection: Connection, id: string): Promise<ApiPoolInfoV4> {
  const account = await connection.getAccountInfo(new PublicKey(id))
  if (account === null) throw Error(' get id info error ')
  const info = LIQUIDITY_STATE_LAYOUT_V4.decode(account.data)

  const marketId = info.marketId
  const marketAccount = await connection.getAccountInfo(marketId)
  if (marketAccount === null) throw Error(' get market info error')
  const marketInfo = MARKET_STATE_LAYOUT_V3.decode(marketAccount.data)

  const lpMint = info.lpMint
  const lpMintAccount = await connection.getAccountInfo(lpMint)
  if (lpMintAccount === null) throw Error(' get lp mint info error')
  const lpMintInfo = SPL_MINT_LAYOUT.decode(lpMintAccount.data)

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
    authority: Liquidity.getAssociatedAuthority({ programId: account.owner }).publicKey.toString(),
    openOrders: info.openOrders.toString(),
    targetOrders: info.targetOrders.toString(),
    baseVault: info.baseVault.toString(),
    quoteVault: info.quoteVault.toString(),
    withdrawQueue: info.withdrawQueue.toString(),
    lpVault: info.lpVault.toString(),
    marketVersion: 3,
    marketProgramId: info.marketProgramId.toString(),
    marketId: info.marketId.toString(),
    marketAuthority: Market.getAssociatedAuthority({ programId: info.marketProgramId, marketId: info.marketId }).publicKey.toString(),
    marketBaseVault: marketInfo.baseVault.toString(),
    marketQuoteVault: marketInfo.quoteVault.toString(),
    marketBids: marketInfo.bids.toString(),
    marketAsks: marketInfo.asks.toString(),
    marketEventQueue: marketInfo.eventQueue.toString(),
    lookupTableAccount: PublicKey.default.toString()
  }
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
export async function buyTx(solanaConnection: Connection, wallet: Keypair, quoteMint: PublicKey, amount: number, poolState: any, quoteAta: PublicKey, poolId: PublicKey) {
  try {
    console.time('21');
    // Code block 1
    const totalAmount = Math.floor((amount) * 10 ** 9)
    const quoteToken = new Token(TOKEN_PROGRAM_ID, quoteMint, 9);
    const quoteTokenAmount = new TokenAmount(quoteToken, totalAmount);
    const poolKeys = await createPoolKeys(poolId, poolState)
    console.timeEnd('21');
    console.time('22');
    // Code block 1
    const baseAta = await getAssociatedTokenAddress(poolState.baseMint, wallet.publicKey)
    console.timeEnd('22');

    console.time('23');
    // Code block 1
    const { innerTransaction } = Liquidity.makeSwapFixedInInstruction(
      {
        poolKeys,
        userKeys: {
          tokenAccountIn: quoteAta,
          tokenAccountOut: baseAta,
          owner: wallet.publicKey,
        },
        amountIn: quoteTokenAmount.raw,
        minAmountOut: 0,

      },
      4,
    )
    console.timeEnd('23');

    console.time('23');
    // Code block 1
    const transaction = new Transaction();
    if (!await solanaConnection.getAccountInfo(quoteAta, { commitment: "processed" }))
      transaction.add(
        createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          quoteAta,
          wallet.publicKey,
          NATIVE_MINT,
        )
      )
    transaction.add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 150_000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_000_000 }),
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: quoteAta,
        lamports: totalAmount,
      }),
      createSyncNativeInstruction(quoteAta, TOKEN_PROGRAM_ID),
      createAssociatedTokenAccountIdempotentInstruction(
        wallet.publicKey,
        baseAta,
        wallet.publicKey,
        poolState.baseMint,
      ),
      ...innerTransaction.instructions,
    )
    transaction.feePayer = wallet.publicKey
    console.timeEnd('23');
    console.time('24');
    // Code block 1
    transaction.recentBlockhash = (await solanaConnection.getLatestBlockhash("processed")).blockhash
    console.timeEnd('24');
    console.time('26');
    // Code block 1
    const sig = await sendAndConfirmTransaction(solanaConnection, transaction, [wallet], { skipPreflight: true, commitment: "processed" })
    console.timeEnd('26');
    console.log(`https://solscan.io/tx/${sig}`);
  } catch (error) {
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

export async function buy(solanaConnection: Connection, wallet: Keypair, baseMint: PublicKey, quoteMint: PublicKey, amount: string, targetPool: string): Promise<VersionedTransaction | null> {
  while (true) {
    try {

      const tokenAta = await getAssociatedTokenAddress(baseMint, wallet.publicKey);
      const tokenBal = await solanaConnection.getTokenAccountBalance(tokenAta);

      if (!tokenBal || tokenBal.value.uiAmount == 0) {
        return null;
      }

      const balance = tokenBal.value.amount;
      const baseToken = new Token(TOKEN_PROGRAM_ID, baseMint, tokenBal.value.decimals);
      const quoteToken = new Token(TOKEN_PROGRAM_ID, quoteMint, 9);
      const baseTokenAmount = new TokenAmount(baseToken, amount);
      const slippage = new Percent(99, 100);
      const walletTokenAccounts = await getWalletTokenAccount(solanaConnection, wallet.publicKey);


      const instructions = await swapOnlyAmm(solanaConnection, {
        outputToken: quoteToken,
        targetPool,
        inputTokenAmount: baseTokenAmount,
        slippage,
        walletTokenAccounts,
        wallet: wallet,
      });

      const willSendTx = (await buildSimpleTransaction({
        connection: solanaConnection,
        makeTxVersion: TxVersion.V0,
        payer: wallet.publicKey,
        innerTransactions: instructions,
        addLookupTableInfo: LOOKUP_TABLE_CACHE
      }))[0];


      if (willSendTx instanceof VersionedTransaction) {
        willSendTx.sign([wallet]);
        return willSendTx;
      }

      continue;
    } catch (error) {

      return null;
    }
  }
}
