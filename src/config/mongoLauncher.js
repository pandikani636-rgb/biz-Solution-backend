import net from 'net';
import fs from 'fs';
import path from 'path';
import { spawn, execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..', '..');

/**
 * Checks if a TCP port is open and accepting connections.
 */
export const isPortListening = (port = 27017, host = '127.0.0.1', timeout = 1200) => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const finalize = (status) => {
      if (!settled) {
        settled = true;
        socket.destroy();
        resolve(status);
      }
    };

    socket.setTimeout(timeout);
    socket.once('connect', () => finalize(true));
    socket.once('timeout', () => finalize(false));
    socket.once('error', () => finalize(false));

    try {
      socket.connect(port, host);
    } catch {
      finalize(false);
    }
  });
};

/**
 * Finds mongod executable on Windows, macOS, or Linux.
 */
export const findMongodExecutable = () => {
  // Check known Windows MongoDB installations
  if (process.platform === 'win32') {
    const mongoProgramFiles = 'C:\\Program Files\\MongoDB\\Server';
    if (fs.existsSync(mongoProgramFiles)) {
      try {
        const versions = fs.readdirSync(mongoProgramFiles);
        // Sort descending to prefer latest version (e.g. 8.2, 8.0, 7.0)
        versions.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
        for (const ver of versions) {
          const candidate = path.join(mongoProgramFiles, ver, 'bin', 'mongod.exe');
          if (fs.existsSync(candidate)) {
            return candidate;
          }
        }
      } catch {
        // ignore and fallback
      }
    }
  }

  // Check PATH using where (Windows) or which (Unix)
  try {
    const cmd = process.platform === 'win32' ? 'where mongod' : 'which mongod';
    const output = execSync(cmd, { stdio: ['pipe', 'pipe', 'ignore'], encoding: 'utf-8' });
    const lines = output.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length > 0 && fs.existsSync(lines[0])) {
      return lines[0];
    }
  } catch {
    // ignore
  }

  // Common Unix paths
  const unixPaths = ['/usr/bin/mongod', '/usr/local/bin/mongod', '/opt/homebrew/bin/mongod'];
  for (const p of unixPaths) {
    if (fs.existsSync(p)) return p;
  }

  return null;
};

/**
 * Ensures MongoDB is running before proceeding. If local and not running, attempts auto-start.
 */
export const ensureMongoRunning = async (uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/biz_zolution') => {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === 'production') {
    return true;
  }

  const isLocal = uri.includes('127.0.0.1') || uri.includes('localhost');
  if (!isLocal) {
    // Cloud / Remote MongoDB Atlas
    return true;
  }

  const portMatch = uri.match(/:(\d+)/);
  const port = portMatch ? parseInt(portMatch[1], 10) : 27017;
  const host = uri.includes('localhost') ? 'localhost' : '127.0.0.1';

  const alreadyRunning = await isPortListening(port, host);
  if (alreadyRunning) {
    return true;
  }

  console.log(`[MongoDB Launcher] MongoDB not detected on ${host}:${port}. Checking for local executable...`);

  const mongodPath = findMongodExecutable();
  if (!mongodPath) {
    console.warn(`[MongoDB Launcher] 'mongod' executable not found automatically in standard locations.`);
    return false;
  }

  const dbPath = path.resolve(backendRoot, 'data', 'db');
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath, { recursive: true });
  }

  console.log(`[MongoDB Launcher] Launching MongoDB using data directory: ${dbPath}`);

  try {
    const child = spawn(
      mongodPath,
      ['--dbpath', dbPath, '--bind_ip', '127.0.0.1', '--port', String(port)],
      {
        detached: true,
        stdio: 'ignore',
      }
    );

    child.unref();

    // Poll until port is open, wait up to 12 seconds
    const maxAttempts = 24;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((res) => setTimeout(res, 500));
      const isOpen = await isPortListening(port, host);
      if (isOpen) {
        console.log(`[MongoDB Launcher] MongoDB server successfully started on port ${port} (PID ${child.pid}).`);
        return true;
      }
    }

    console.warn(`[MongoDB Launcher] Spawned mongod (PID ${child.pid}), but port ${port} did not respond within 12s.`);
    return false;
  } catch (err) {
    console.error(`[MongoDB Launcher] Error attempting to launch mongod: ${err.message}`);
    return false;
  }
};
