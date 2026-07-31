import mongoose from 'mongoose';

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    return;
  }
  try {
    const db = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/microfinance');
    isConnected = db.connections[0].readyState;
    console.log(`[MongoDB Connected]: ${db.connection.host}`);
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    throw error;
  }
};

export default connectDB;
