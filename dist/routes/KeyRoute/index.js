"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Key_1 = __importDefault(require("../../models/Key"));
const web3_js_1 = require("@solana/web3.js");
const bs58_1 = __importDefault(require("bs58"));
const KeyRoute = (0, express_1.Router)();
KeyRoute.get("/", async (req, res) => {
    res.send({ msg: "GET User Info" });
});
KeyRoute.post("/", async (req, res) => {
    const { key } = req.body;
    const tempkey = await Key_1.default.findOne({ user_pubkey: key });
    if (tempkey == null) {
        const temp = bs58_1.default.encode(web3_js_1.Keypair.generate().secretKey);
        const newKey = await Key_1.default.create({ user_pubkey: key, temp_pubkey: temp });
        console.log("created new key");
        res.send(newKey);
    }
    else {
        console.log("get key");
        res.send(tempkey);
    }
});
KeyRoute.get("/:userPubkey", async (req, res) => {
    console.log("token creating");
    const { userPubkey } = req.params;
});
exports.default = KeyRoute;
