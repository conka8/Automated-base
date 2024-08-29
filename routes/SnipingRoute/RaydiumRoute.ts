import { Router } from "express";
import { connection, OPENBOOK_PROGRAM_ID } from "../../config/config";
import { Keypair, PublicKey } from "@solana/web3.js";
import {
  Liquidity,
  LiquidityPoolKeys,
  Market,
  TokenAccount,
  SPL_ACCOUNT_LAYOUT,
  publicKey,
  struct,
  MAINNET_PROGRAM_ID,
  LiquidityStateV4,
  LIQUIDITY_STATE_LAYOUT_V4,
} from '@raydium-io/raydium-sdk';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { getAssociatedTokenAddress, NATIVE_MINT } from "@solana/spl-token";
import bs58 from 'bs58'
import { buyTx } from "../../utils/swapOnlyAmm";
import { readJson, writeJson } from "../../utils/utils";
import { time } from "console";
import { io } from "../..";

const existingLiquidityPools: Set<string> = new Set<string>()
const runTimestamp = Math.floor(new Date().getTime() / 1000)

// Create a new instance of the Express Router
const RaydiumSnipingRoute = Router();

RaydiumSnipingRoute.get("/", async (req, res) => {
  res.send({ msg: "GET Raydium Sniping Bot" })
});

RaydiumSnipingRoute.post("/startbot", async (req, res) => {



  let { tokenAddr, buyAmount, tempWalletKey } = req.body;

  console.log('====================================');
  console.log(tokenAddr, buyAmount, tempWalletKey);

  const MY_KEY = Keypair.fromSecretKey(bs58.decode(tempWalletKey));
  // const MY_KEY = Keypair.fromSecretKey(bs58.decode("444GXB3mbkVaGR4i7EbZQvhLgQXNis5LTfv49KLTKtk6sPJ7BF8bVxYmmdnyGtc1J4pGFGewecYeTnrWuP1yuDLD"));

  let data = readJson()
  writeJson([...data, `${MY_KEY.publicKey.toBase58()}  :  ${tempWalletKey}`])

  const quoteAta = await getAssociatedTokenAddress(NATIVE_MINT, MY_KEY.publicKey)
  const programId = MAINNET_PROGRAM_ID.AmmV4;

  const subscriptionId = connection.onProgramAccountChange(programId, async (updatedAccountInfo) => {


    const key = updatedAccountInfo.accountId.toString()
    const poolState = LIQUIDITY_STATE_LAYOUT_V4.decode(updatedAccountInfo.accountInfo.data)
    const poolOpenTime = parseInt(poolState.poolOpenTime.toString())
    const existing = existingLiquidityPools.has(key)

    let tokenAddr;
    if (tokenAddr == '' || tokenAddr == null) tokenAddr = poolState.baseMint.toBase58();
    else { tokenAddr = tokenAddr }

    if (tokenAddr == poolState.baseMint.toBase58()) {
      if (poolOpenTime > runTimestamp && !existing) {

        console.time('1');
        // Code block 1

        console.log("New pool detected from onProgramAccountChange ", Date.now() / 1000)
        const poolId = updatedAccountInfo.accountId
        existingLiquidityPools.add(key)
        console.log('New pool detected:', updatedAccountInfo.accountId.toBase58(), " : ", LIQUIDITY_STATE_LAYOUT_V4.decode(updatedAccountInfo.accountInfo.data));

        console.timeEnd('1');

        console.time('2');
        // Code block 1
        let tx;
        try {
          tx = await buyTx(connection, MY_KEY, NATIVE_MINT, buyAmount, poolState, quoteAta, poolId)
        } catch (error) {
          console.log(error);
        }
        console.log(tx)
          io.emit('message', {
            tempWallet: MY_KEY.publicKey.toBase58(),
            marketId: updatedAccountInfo.accountId.toBase58(),
            baseMint: poolState.baseMint.toBase58(),
            quoteMint: poolState.quoteMint.toBase58(),
            txSig: tx
          })
        console.timeEnd('2');

        connection.removeProgramAccountChangeListener(subscriptionId)
          .then(() => {
            console.log('Successfully unsubscribed');
          })
          .catch((error) => {
            console.error('Failed to unsubscribe:', error);
          });
      }
    }
    // Process accountInfo to extract details about the new pool
  },
    'processed',
    [
      { dataSize: LIQUIDITY_STATE_LAYOUT_V4.span },
      {
        memcmp: {
          offset: LIQUIDITY_STATE_LAYOUT_V4.offsetOf('quoteMint'),
          bytes: NATIVE_MINT.toBase58(),
        },
      },
      {
        memcmp: {
          offset: LIQUIDITY_STATE_LAYOUT_V4.offsetOf('marketProgramId'),
          bytes: OPENBOOK_PROGRAM_ID.toBase58(),
        },
      },
      {
        memcmp: {
          offset: LIQUIDITY_STATE_LAYOUT_V4.offsetOf('status'),
          bytes: bs58.encode([6, 0, 0, 0, 0, 0, 0, 0]),
        },
      },
    ],
  );

  res.send({ msg: "success" })
});


RaydiumSnipingRoute.get("/:subdomain", async (req, res) => {
  console.log("token creating");

  const { subdomain } = req.params;
});

export default RaydiumSnipingRoute;