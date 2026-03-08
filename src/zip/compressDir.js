import { readdir, stat, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { createReadStream, createWriteStream } from 'node:fs';
import { createBrotliCompress } from 'node:zlib';
import { PassThrough } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const compressDir = async () => {
  const rootDir = path.resolve('workspace');
  const toCompressDir = path.join(rootDir, 'toCompress');
  const outputPath = path.join(rootDir, 'compressed', 'archive.br');

  await isWorkspaceExist(toCompressDir);
  await checkDestFolder(rootDir);

  const archiveStream = new PassThrough();
  const brotli = createBrotliCompress();
  const outputStream = createWriteStream(outputPath);

  const pipelinePromise = pipeline(archiveStream, brotli, outputStream);

  const files = await collectFiles(toCompressDir, toCompressDir);

  for (const { filePath, relativePath, size } of files) {
    const header = createHeader(relativePath, size);
    await writeToStream(archiveStream, header);

    await new Promise((resolve, reject) => {
      const readStream = createReadStream(filePath);
      readStream.pipe(archiveStream, { end: false });
      readStream.on('end', resolve);
      readStream.on('error', reject);
    });
  }

  archiveStream.end();
  await pipelinePromise;
};

function createHeader(relativePath, contentLength) {
  const pathBuffer = Buffer.from(relativePath, 'utf8');
  const header = Buffer.allocUnsafe(4 + pathBuffer.length + 4);
  header.writeUInt32LE(pathBuffer.length, 0);
  pathBuffer.copy(header, 4);
  header.writeUInt32LE(contentLength, 4 + pathBuffer.length);
  return header;
}

function writeToStream(stream, data) {
  return new Promise((resolve, reject) => {
    stream.write(data, (err) => (err ? reject(err) : resolve()));
  });
}

async function collectFiles(dirPath, basePath, result = []) {
  const entries = await readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.relative(basePath, fullPath).replace(/\\/g, '/');

    if (entry.isFile()) {
      const fileStat = await stat(fullPath);
      result.push({ filePath: fullPath, relativePath, size: fileStat.size });
    } else if (entry.isDirectory()) {
      await collectFiles(fullPath, basePath, result);
    }
  }
  return result;
}

async function checkDestFolder(rootDirPath) {
  const distDirName = 'compressed';
  const distDir = path.join(rootDirPath, distDirName);
  try {
    const isDestDir = await stat(distDir);
    if (!isDestDir.isDirectory()) {
      await mkdir(distDir, { recursive: true });
    }
  } catch {
    await mkdir(distDir, { recursive: true });
  }
}

async function isWorkspaceExist(dirPath) {
  try {
    const stats = await stat(dirPath);
    if (!stats.isDirectory()) {
      throw new Error('FS operation failed');
    }
  } catch {
    throw new Error('FS operation failed');
  }
}

await compressDir();
