import { readFile, stat, readdir, writeFile } from 'fs/promises';
import path from 'path';

const { argv } = process;
const ROOT_PATH = path.resolve('workspace');
const TARGET_DIR = path.join(ROOT_PATH, 'parts');
const FILE_NAME = 'merged';
const EXT = 'txt';

const merge = async () => {
  // Write your code here
  // Default: read all .txt files from workspace/parts in alphabetical order
  // Optional: support --files filename1,filename2,... to merge specific files in provided order
  // Concatenate content and write to workspace/merged.txt

  await isWorkspaceExist(ROOT_PATH, TARGET_DIR);

  const content = await getFilesData(TARGET_DIR);

  await createOutputFile(ROOT_PATH, FILE_NAME, EXT, content);
};

await merge();

function parsedName(name) {
  return path.parse(name).name.toLowerCase();
}

async function createOutputFile(workspacePath, fileName, ext, data) {
  const outputPath = path.join(workspacePath, fileName + '.' + ext);
  await writeFile(outputPath, data, 'utf-8');
}

function sortFilesByUserOrder(userOrder, result) {
  const orderMap = new Map();
  let index = 0;
  for (const item of userOrder) {
    orderMap.set(item, index++);
  }

  result.sort((a, b) => {
    const aName = parsedName(a.name);
    const bName = parsedName(b.name);
    const aInSet = orderMap.has(aName);
    const bInSet = orderMap.has(bName);
    if (aInSet && bInSet) {
      return orderMap.get(aName) - orderMap.get(bName);
    }
    if (aInSet) return -1;
    if (bInSet) return 1;
    return 0;
  });

  return result.filter((res) => userOrder.has(parsedName(res.name)));
}

async function getFilesData(targetDirPath, result = '') {
  const dirEntries = await readdir(targetDirPath, { withFileTypes: true });

  const txtFiles = dirEntries.filter(
    (entry) => path.extname(entry.name) === '.txt',
  );

  const filteredTxtFiles = txtFiles.sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  if (argv.indexOf('--files') !== -1) {
    const input = [];

    for (let i = 2; i < argv.length; i++) {
      if (argv[i + 1]) {
        const tmp = argv[i + 1]
          .toLowerCase()
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        input.push(...tmp);
      }
    }
    const set = new Set(input);
    const existingNames = new Set(txtFiles.map((f) => parsedName(f.name)));
    const missingNames = [...set].filter((name) => !existingNames.has(name));
    if (missingNames.length > 0) {
      throw new Error('FS operation failed');
    }
    const SortedByUserTxtFiles = sortFilesByUserOrder(set, txtFiles);

    for (const txtFile of SortedByUserTxtFiles) {
      const filePath = path.join(targetDirPath, txtFile.name);
      const content = await readFile(filePath, {
        encoding: 'utf8',
      });
      result += content + '\n';
    }
  } else {
    for (const txtFile of filteredTxtFiles) {
      const filePath = path.join(targetDirPath, txtFile.name);
      const content = await readFile(filePath, {
        encoding: 'utf8',
      });
      result += content + '\n';
    }
  }
  return result;
}

async function isWorkspaceExist(workspacePath, targetDirPath) {
  try {
    const rootStats = await stat(workspacePath);
    const partsStats = await stat(targetDirPath);
    const dirEntries = await readdir(targetDirPath, { withFileTypes: true });
    const isTxtFile = dirEntries.some(
      (dir) => path.extname(dir.name) === '.txt',
    );

    if (!rootStats.isDirectory() || !partsStats.isDirectory() || !isTxtFile) {
      throw new Error('FS operation failed');
    }
  } catch {
    throw new Error('FS operation failed');
  }
}
