import { Router } from "express";
import Key from "../../models/Key";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58"

const KeyRoute = Router();

KeyRoute.get("/", async (req, res) => {
    res.send({ msg: "GET User Info" })
});

KeyRoute.post("/", async (req, res) => {
    const { key } = req.body;

    const tempkey = await Key.findOne({ user_pubkey: key })

    if (tempkey == null) {
        const temp = bs58.encode(Keypair.generate().secretKey)
        const newKey = await Key.create({ user_pubkey: key, temp_pubkey: temp })

        console.log("created new key")

        res.send(newKey)
    } else {
        console.log("get key")

        res.send(tempkey)
    }
});


KeyRoute.get("/:userPubkey", async (req, res) => {
    console.log("token creating");

    const { userPubkey } = req.params;
});

export default KeyRoute;