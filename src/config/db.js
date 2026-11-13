import mongoose from 'mongoose';
import { ensureMongoRunning } from './mongoLauncher.js';

export const connectDB = async () => {
  // If already connected (cached connection in serverless or persistent process), return existing connection
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/biz_zolution';
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  const isProduction = process.env.NODE_ENV === 'production';

  // Automatically start local MongoDB if running locally in development
  if (!isServerless && !isProduction) {
    await ensureMongoRunning(uri);
  }

  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: !isProduction, // Disable in production for better serverless performance
      serverSelectionTimeoutMS: 8000,
      tlsAllowInvalidCertificates: !isProduction || uri.includes('mongodb.net'),
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`\n===============================================================`);
    console.error(`[Database Error] Failed to connect to MongoDB: ${error.message}`);
    console.error(`Target URI: ${uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
    console.error(`Troubleshooting Steps:`);
    console.error(`1. If deployed to Vercel/Cloud, ensure MONGODB_URI is set in Environment Variables.`);
    console.error(`2. In MongoDB Atlas -> Network Access, ensure 0.0.0.0/0 (Anywhere) is allowed.`);
    console.error(`3. If local, ensure local MongoDB service is running.`);
    console.error(`===============================================================\n`);

    if (isServerless) {
      throw error; // Let serverless error handler return clean 500 JSON instead of crashing container
    } else {
      process.exit(1);
    }
  }
};
