/*
  PostgreSQL backup helper for Docker-based setups.
  - Reads DATABASE_URL from .env or environment
  - If DB_CONTAINER env is set, uses `docker exec` inside that container
  - Otherwise, runs a temporary `postgres:16-alpine` container with pg_dump
  - Writes timestamped dump to ./backups/
*/
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

function loadDotEnv(envPath: string) {
  try {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const key = m[1];
      let val = m[2];
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch {}
}

function parseDatabaseUrl(dbUrl: string) {
  const u = new URL(dbUrl);
  if (u.protocol !== 'postgres:' && u.protocol !== 'postgresql:') {
    throw new Error(`Unsupported protocol in DATABASE_URL: ${u.protocol}`);
  }
  const user = decodeURIComponent(u.username);
  const password = decodeURIComponent(u.password);
  const host = u.hostname;
  const port = u.port ? parseInt(u.port, 10) : 5432;
  const dbName = u.pathname.replace(/^\//, '');
  return { user, password, host, port, dbName };
}

async function run() {
  const projectRoot = path.resolve(__dirname, '..');
  // Load .env at repo root
  loadDotEnv(path.resolve(projectRoot, '.env'));
  // Also try one dir up (in case tools is nested deeper)
  loadDotEnv(path.resolve(projectRoot, '..', '.env'));

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL not found in environment or .env');
    process.exit(1);
  }
  const { user, password, host, port, dbName } = parseDatabaseUrl(dbUrl);

  const backupsDir = path.resolve(projectRoot, 'backups');
  fs.mkdirSync(backupsDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15); // YYYYMMDDHHMMSS approx
  const fileBase = `pg_${dbName}_${ts}`;
  const dumpPath = path.join(backupsDir, `${fileBase}.dump`); // pg_dump custom format

  const containerName = process.env.DB_CONTAINER || process.env.POSTGRES_CONTAINER || '';
  const useExec = !!containerName;

  if (useExec) {
    console.log(`Backing up via docker exec into container '${containerName}' -> ${dumpPath}`);
    const out = fs.createWriteStream(dumpPath);
    const args = [
      'exec',
      '-e', `PGPASSWORD=${password}`,
      containerName,
      'pg_dump',
      '-h', '127.0.0.1', // inside container, postgres likely on localhost
      '-p', String(port),
      '-U', user,
      '-d', dbName,
      '-Fc', // custom compressed format
    ];
    await new Promise<void>((resolve, reject) => {
      const child = spawn('docker', args, { stdio: ['ignore', 'pipe', 'inherit'] });
      child.stdout.pipe(out);
      child.on('error', reject);
      child.on('close', (code) => {
        out.close();
        if (code === 0) resolve(); else reject(new Error(`docker exec exited with ${code}`));
      });
    });
    console.log('Backup completed.');
    return;
  }

  // Fallback: run a temporary pg_dump container that connects to host:port
  // If DATABASE_URL host is localhost/127.0.0.1, prefer host.docker.internal for Docker Desktop
  const resolvedHost = ['localhost', '127.0.0.1', '::1'].includes(host) ? 'host.docker.internal' : host;
  console.log(`Backing up via temporary container (postgres:16-alpine) -> ${dumpPath}`);
  // Mount backups dir and write directly with -f to avoid shell redirections
  const args = [
    'run', '--rm',
    '-e', `PGPASSWORD=${password}`,
    '-v', `${backupsDir}:/backup`,
    'postgres:16-alpine',
    'pg_dump',
    '-h', resolvedHost,
    '-p', String(port),
    '-U', user,
    '-d', dbName,
    '-Fc',
    '-f', `/backup/${fileBase}.dump`,
  ];

  await new Promise<void>((resolve, reject) => {
    const child = spawn('docker', args, { stdio: 'inherit' });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve(); else reject(new Error(`docker run exited with ${code}`));
    });
  });
  console.log('Backup completed.');
}

run().catch((e) => {
  console.error('Backup failed:', e);
  process.exit(1);
});
