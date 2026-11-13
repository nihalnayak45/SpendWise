import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Resolve current directory for ES module runtime
const currentDir = path.dirname(fileURLToPath(import.meta.url));

// Candidate locations for backend .env file
const candidatePaths = [
  path.resolve(process.cwd(), 'backend/.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(currentDir, '../../../backend/.env'),
  path.resolve(currentDir, '../../.env'),
  path.resolve(currentDir, '../.env'),
];

let loadedEnvPath: string | null = null;

for (const candidate of candidatePaths) {
  if (fs.existsSync(candidate)) {
    const result = dotenv.config({ path: candidate });
    if (!result.error && result.parsed && Object.keys(result.parsed).length > 0) {
      loadedEnvPath = candidate;
      break;
    }
  }
}

// Fallback to default if none found
if (!loadedEnvPath) {
  dotenv.config();
}

export const ENV_LOADED_FROM = loadedEnvPath;
