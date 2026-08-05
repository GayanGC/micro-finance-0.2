import mongoose from 'mongoose';

let isConnected = false;

export const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }
  try {
    const connStr = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/microfinance';
    const db = await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`[MongoDB Connected]: ${db.connection.host}`);
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    if (process.env.NODE_ENV === 'test') {
      console.log('[Test Mode]: Proceeding with mock/local handling...');
      isConnected = false;
    } else {
      throw error;
    }
  }
};

export default connectDB;
