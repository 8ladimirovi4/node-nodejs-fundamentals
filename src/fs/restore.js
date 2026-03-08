import { promises as fs } from 'fs';
import path from 'path';

const restore = async () => {
  const snapshotPath = path.resolve('snapshot.json');
  const outputPath = path.resolve('workspace_restored');

  await ensureSnapshotExists(snapshotPath);
  await ensureWorkspaceRestoredNotExists(outputPath);

  const data = await readSnapshot(snapshotPath);

  for (const entry of data.entries) {
    const fullPath = path.join(outputPath, entry.path);

    if (entry.type === 'directory') {
      await fs.mkdir(fullPath, { recursive: true });
    }

    if (entry.type === 'file') {
      const dir = path.dirname(fullPath);
      await fs.mkdir(dir, { recursive: true });
      const content = Buffer.from(entry.content, 'base64');
      await fs.writeFile(fullPath, content);
    }
  }
};

await restore();

async function ensureSnapshotExists(snapshotPath) {
  try {
    const stats = await fs.stat(snapshotPath);
    if (!stats.isFile()) {
      throw new Error('FS operation failed');
    }
  } catch {
    throw new Error('FS operation failed');
  }
}

async function ensureWorkspaceRestoredNotExists(outputPath) {
  try {
    await fs.stat(outputPath);
    throw new Error('FS operation failed');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return;
    }
    throw error;
  }
}

async function readSnapshot(snapshotPath) {
  const content = await fs.readFile(snapshotPath, 'utf-8');
  return JSON.parse(content);
}
