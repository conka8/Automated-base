"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const KeySchema = new mongoose_1.default.Schema({
    user_pubkey: {
        type: String,
        unique: true,
        require: true
    },
    temp_pubkey: {
        type: String,
        require: true
    }
});
exports.default = mongoose_1.default.model("User", KeySchema);
