import { promises as fs } from 'fs';
import path from 'path';

const snapshot = async () => {
  const rootPath = path.resolve('workspace');

  await isWorkspaceExist(rootPath);

  const files = await fs.readdir(rootPath, { withFileTypes: true });

  const entries = await createFlatEntries(files, rootPath);

  const data = {
    rootPath,
    entries,
  };

  await writeSnapshot(data, rootPath);
};

await snapshot();

async function writeSnapshot(data, workspacePath) {
  const outputPath = path.join(path.dirname(workspacePath), 'snapshot.json');
  await fs.writeFile(outputPath, JSON.stringify(data, null, 2), 'utf-8');
}

async function isWorkspaceExist(workspacePath) {
  try {
    const stats = await fs.stat(workspacePath);

    if (!stats.isDirectory()) {
      throw new Error('FS operation failed');
    }
  } catch {
    throw new Error('FS operation failed');
  }
}

async function createFlatEntries(
  entries,
  workspaceRoot,
  currentDir = 'workspace',
  result = [],
) {
  for (const entry of entries) {
    const fullPath = path.resolve(currentDir, entry.name);
    const relativePath = path
      .relative(workspaceRoot, fullPath)
      .replaceAll('\\', '/'); //normalize for POSIX and windows

    if (entry.isFile()) {
      const meta = await fs.stat(fullPath);
      const fileData = await fs.readFile(fullPath, {
        encoding: 'base64',
      });

      const item = {
        path: relativePath,
        type: 'file',
        size: meta.size,
        content: fileData,
      };

      result.push(item);
    }

    if (entry.isDirectory()) {
      const item = {
        path: relativePath,
        type: 'directory',
      };

      result.push(item);

      const nextDir = path.join(currentDir, entry.name);
      const nextEntries = await fs.readdir(nextDir, { withFileTypes: true });

      await createFlatEntries(nextEntries, workspaceRoot, nextDir, result);
    }
  }
  return result;
}
