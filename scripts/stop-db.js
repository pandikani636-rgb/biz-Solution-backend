import { execSync } from 'child_process';

const stopMongo = () => {
  console.log('[Database Helper] Stopping local MongoDB process...');
  try {
    if (process.platform === 'win32') {
      execSync('powershell -Command "Stop-Process -Name mongod -Force -ErrorAction SilentlyContinue"', { stdio: 'ignore' });
    } else {
      execSync('pkill -f mongod || true', { stdio: 'ignore' });
    }
    console.log('[Database Helper] MongoDB stopped successfully.');
  } catch (err) {
    console.log('[Database Helper] No active local MongoDB process was found or error occurred.');
  }
};

stopMongo();
