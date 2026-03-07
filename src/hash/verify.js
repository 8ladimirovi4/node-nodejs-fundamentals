import fs from 'fs/promises';
import { createReadStream } from 'fs';
import path from 'path';
import crypto from 'crypto';

const verify = async () => {
  // Write your code here
  // Read checksums.json
  // Calculate SHA256 hash using Streams API
  // Print result: filename — OK/FAIL

  //create file_*.txt in the root of workspace dir
  //create checksums.json in the root dir

  const checksumsFilePath = path.resolve('checksums.json');
  const txtFilesDir = 'workspace';

  await isWorkspaceExist(checksumsFilePath);

  const json = await readFileData(checksumsFilePath);

  for (const [file, expectedHash] of Object.entries(json)) {
    const filePath = path.join(txtFilesDir, file);
    try {
      const actualHash = await calculateHash(filePath);

      if (actualHash === expectedHash) {
        console.log(`${file} — OK`);
      } else {
        console.log(`${file} — FAIL`);
      }
    } catch {
      console.log(`${file} — FAIL`);
    }
  }
};

await verify();

function calculateHash(file) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = createReadStream(file);

    stream.on('data', (chunk) => {
      hash.update(chunk);
    });

    stream.on('end', () => {
      resolve(hash.digest('hex'));
    });

    stream.on('error', reject);
  });
}

async function readFileData(filePath) {
  const fileData = await fs.readFile(filePath, {
    encoding: 'utf8',
  });
  return JSON.parse(fileData);
}

async function isWorkspaceExist(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    throw new Error('FS operation failed');
  }
}
