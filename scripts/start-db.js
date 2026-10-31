import dotenv from 'dotenv';
dotenv.config();

import { ensureMongoRunning, isPortListening } from '../src/config/mongoLauncher.js';

const main = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/biz_zolution';
  console.log(`[Database Helper] Ensuring MongoDB is running for ${uri}...`);

  const success = await ensureMongoRunning(uri);
  if (success) {
    console.log(`[Database Helper] MongoDB is active and ready for connections!`);
    process.exit(0);
  } else {
    console.error(`[Database Helper] Failed to start or detect MongoDB.`);
    process.exit(1);
  }
};

main();
