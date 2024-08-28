import mongoose from "mongoose";

const connecttDB = (url : string) => {
  return mongoose.connect(url);
};

export default connecttDB;