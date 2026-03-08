import {
  createReadStream,
  createWriteStream,
  readdirSync,
  unlinkSync,
} from 'fs';
import path from 'path';

const split = async () => {
  const sourceFile = path.resolve('source.txt');
  const cwd = process.cwd();
  readdirSync(cwd)
    .filter((f) => f.startsWith('chunk_') && f.endsWith('.txt'))
    .forEach((f) => unlinkSync(path.join(cwd, f)));
  const linesArgIdx = process.argv.indexOf('--lines');
  let linesCount = 10;

  if (linesArgIdx !== -1 && process.argv[linesArgIdx + 1]) {
    linesCount = parseInt(process.argv[linesArgIdx + 1], 10) || 10;
  }

  await processFile(sourceFile, linesCount);
};

await split();

function processFile(filePath, linesCount) {
  return new Promise((resolve, reject) => {
    const readStream = createReadStream(filePath);
    let buffer = '';
    let lineBuffer = [];
    let chunkIndex = 1;

    const writeChunk = (lines) => {
      if (lines.length === 0) return;
      const writeStream = createWriteStream(`chunk_${chunkIndex}.txt`);
      writeStream.write(lines.join('\n') + '\n');
      writeStream.end();
      chunkIndex++;
    };

    readStream.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        lineBuffer.push(line);
        if (lineBuffer.length >= linesCount) {
          writeChunk(lineBuffer);
          lineBuffer = [];
        }
      }
    });

    readStream.on('end', () => {
      if (buffer) {
        lineBuffer.push(buffer);
      }
      if (lineBuffer.length > 0) {
        writeChunk(lineBuffer);
      }
      resolve();
    });

    readStream.on('error', reject);
  });
}
