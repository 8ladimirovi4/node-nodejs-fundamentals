import { spawn } from 'child_process';

const execCommand = () => {
    // Write your code here
  // Take command from CLI argument
  // Spawn child process
  // Pipe child stdout/stderr to parent stdout/stderr
  // Pass environment variables
  // Exit with same code as child

  const command = process.argv[2];
  if (!command) {
    process.exit(1);
  }

  const child = spawn(command, {
    shell: true,
    env: process.env,
  });

  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);

  child.on('close', (code) => {
    process.exit(code ?? 1);
  });
};

execCommand();
