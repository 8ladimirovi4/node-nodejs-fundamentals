import { Worker } from 'worker_threads';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { cpus } from 'os';

const DATA_PATH = join(import.meta.dirname, '..', '..', 'data.json');
const WORKER_PATH = join(import.meta.dirname, 'worker.js');

function splitIntoChunks(arr, n) {
  const chunks = [];
  const chunkSize = Math.ceil(arr.length / n);
  for (let i = 0; i < n; i++) {
    const start = i * chunkSize;
    chunks.push(arr.slice(start, start + chunkSize));
  }
  return chunks.filter((chunk) => chunk.length > 0);
}

function mergeSortedChunks(chunks) {
  const indices = chunks.map(() => 0);
  const result = [];

  while (true) {
    let minVal = Infinity;
    let minIdx = -1;

    for (let i = 0; i < chunks.length; i++) {
      const idx = indices[i];
      if (idx < chunks[i].length && chunks[i][idx] < minVal) {
        minVal = chunks[i][idx];
        minIdx = i;
      }
    }

    if (minIdx === -1) break;

    result.push(minVal);
    indices[minIdx]++;
  }

  return result;
}

function sortChunkInWorker(chunk) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(WORKER_PATH);
    worker.postMessage(chunk);
    worker.on('message', (sorted) => {
      worker.terminate();
      resolve(sorted);
    });
    worker.on('error', reject);
  });
}

const main = async () => {
    // Write your code here
  // Read data.json containing array of numbers
  // Split into N chunks (N = CPU cores)
  // Create N workers, send one chunk to each
  // Collect sorted chunks
  // Merge using k-way merge algorithm
  // Log final sorted array
  
  const raw = await readFile(DATA_PATH, 'utf-8');
  const numbers = JSON.parse(raw);

  const n = Math.max(1, cpus().length);
  const chunks = splitIntoChunks(numbers, n);

  const sortedChunks = await Promise.all(
    chunks.map((chunk) => sortChunkInWorker(chunk))
  );

  const result = mergeSortedChunks(sortedChunks);
  console.log(result);
};

await main();
