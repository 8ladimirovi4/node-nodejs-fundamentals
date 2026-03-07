import path from 'path';
import fs from 'fs/promises';

const { argv, stdout } = process;

const findByExt = async () => {
  // Write your code here
  // Recursively find all files with specific extension
  // Parse --ext CLI argument (default: .txt)

  const rootPath = path.resolve('workspace');

  await isWorkspaceExist(rootPath);

  const dirEntries = await fs.readdir(rootPath, { withFileTypes: true });

  const files = await findFiles(dirEntries);

  const extIndex = argv.lastIndexOf('--ext');
  const userInputs =
    extIndex !== -1 ? findAllUserInputs(extIndex) : new Set(['txt']);

  const filteredFiles = filterFilesByUserInput(files, userInputs);

  for (const filteredFile of filteredFiles) {
    stdout.write(filteredFile.path + '\n');
  }
};

await findByExt();

function filterFilesByUserInput(entries, inputs) {
  const result = entries.filter((entry) => {
    const ext = path.extname(entry.name);
    return inputs.has(ext.replaceAll('.', '').toLowerCase());
  });

  return result.sort((a, b) => a.path.localeCompare(b.path));
}

function findAllUserInputs(index, result = []) {
  const ext = argv[index + 1];
  if (ext) {
    result.push(ext.toLowerCase());
    findAllUserInputs(index + 1, result);
  }
  return new Set(result.map((el) => el.replaceAll('.', '')));
}

async function findFiles(entries, result = [], currentDir = 'workspace') {
  for (const entry of entries) {
    if (entry.isFile()) {
      const item = {
        name: entry.name,
        path: path.join(currentDir, entry.name),
      };
      result.push(item);
    }

    if (entry.isDirectory()) {
      const nextDir = path.join(currentDir, entry.name);
      const nextEntries = await fs.readdir(nextDir, { withFileTypes: true });

      await findFiles(nextEntries, result, nextDir);
    }
  }
  return result;
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
