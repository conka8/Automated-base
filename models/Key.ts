import mongoose from "mongoose";

const KeySchema = new mongoose.Schema({
  user_pubkey: {
    type: String,
    unique: true,
    require : true
  },
  temp_pubkey: {
    type: String,
    require : true
  }
});

export default mongoose.model("User", KeySchema);