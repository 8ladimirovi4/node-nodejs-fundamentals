import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { createReadStream, createWriteStream } from 'node:fs';
import { createBrotliDecompress } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { Writable } from 'node:stream';

const decompressDir = async () => {
  const rootDir = path.resolve('workspace');
  const compressedDir = path.join(rootDir, 'compressed');
  const archivePath = path.join(compressedDir, 'archive.br');
  const outputDir = path.join(rootDir, 'decompressed');

  await ensureArchiveExists(compressedDir, archivePath);
  await mkdir(outputDir, { recursive: true });

  const readStream = createReadStream(archivePath);
  const brotli = createBrotliDecompress();
  const extractor = new ArchiveExtractor(outputDir);

  await pipeline(readStream, brotli, extractor);
};

async function ensureArchiveExists(compressedDir, archivePath) {
  try {
    const dirStats = await stat(compressedDir);
    if (!dirStats.isDirectory()) {
      throw new Error('FS operation failed');
    }
    const fileStats = await stat(archivePath);
    if (!fileStats.isFile()) {
      throw new Error('FS operation failed');
    }
  } catch {
    throw new Error('FS operation failed');
  }
}

class ArchiveExtractor extends Writable {
  constructor(outputDir) {
    super();
    this.outputDir = outputDir;
    this.buffer = Buffer.alloc(0);
  }

  _write(chunk, encoding, callback) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    this.processBuffer(callback);
  }

  processBuffer(callback) {
    const processNext = () => {
      if (this.buffer.length < 8) {
        callback();
        return;
      }

      const pathLen = this.buffer.readUInt32LE(0);
      const headerSize = 4 + pathLen + 4;

      if (this.buffer.length < headerSize) {
        callback();
        return;
      }

      const relativePath = this.buffer.subarray(4, 4 + pathLen).toString('utf8');
      const contentLen = this.buffer.readUInt32LE(4 + pathLen);

      if (this.buffer.length < headerSize + contentLen) {
        callback();
        return;
      }

      const content = this.buffer.subarray(headerSize, headerSize + contentLen);
      this.buffer = this.buffer.subarray(headerSize + contentLen);

      this.writeFile(relativePath, content)
        .then(() => processNext())
        .catch(callback);
    };

    processNext();
  }

  async writeFile(relativePath, content) {
    const fullPath = path.join(this.outputDir, relativePath);
    const dir = path.dirname(fullPath);
    await mkdir(dir, { recursive: true });

    const writeStream = createWriteStream(fullPath);
    await new Promise((resolve, reject) => {
      writeStream.write(content, (err) =>
        err ? reject(err) : writeStream.end(resolve)
      );
    });
  }
}

await decompressDir();
