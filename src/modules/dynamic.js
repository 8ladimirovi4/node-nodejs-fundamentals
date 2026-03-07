import path from 'path';
import { fileURLToPath } from 'url';

const dynamic = async () => {
  // Write your code here
  // Accept plugin name as CLI argument
  // Dynamically import plugin from plugins/ directory
  // Call run() function and print result
  // Handle missing plugin case
  await runModule();
};

await dynamic();

async function runModule() {
  const plugin = process.argv[2];
  if (!plugin) {
    console.error('Plugin not found');
    process.exit(1);
  }

  try {
    const url = import.meta.url;
    const __dirname = path.dirname(fileURLToPath(url));
    const modulePath = path.join(__dirname, 'plugins', `${plugin}.js`);
    const module = await import(modulePath);

    console.log(module.run());
  } catch (error) {
    console.error('Plugin not found');
    process.exit(1);
  }
}
