import { createInterface } from 'readline/promises';

const { stdin: STD_IN, stdout: STD_OUT } = process;

const interactive = () => {
  const rl = createInterface({
    input: STD_IN,
    output: STD_OUT,
    prompt: '> ',
  });

  rl.prompt();

  rl.on('line', (input) => {
    userPromptsMap(rl, input);
  });

  const exit = () => {
    console.log('\nGoodbye!');
    process.exit(0);
  };

  rl.on('SIGINT', () => {
    rl.close();
  });

  rl.on('close', exit);
};

interactive();

function userPromptsMap(rl, input) {
  const trimmed = input.trim();
  switch (trimmed) {
    case 'uptime':
      console.log(`Uptime: ${process.uptime().toFixed(2)}s`);
      break;
    case 'cwd':
      console.log(process.cwd());
      break;
    case 'date':
      console.log(new Date().toISOString());
      break;
    case 'exit':
      rl.close();
      process.exit(0);
      break;
    default:
      if (trimmed) {
        console.log('Unknown command');
      }
      break;
  }
  rl.prompt();
}
