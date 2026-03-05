function parseProgressArgs(argv) {
  const config = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--duration' && argv[i + 1] != null) {
      config.d = Number(argv[++i]);
    } else if (argv[i] === '--interval' && argv[i + 1] != null) {
      config.i = Number(argv[++i]);
    } else if (argv[i] === '--length' && argv[i + 1] != null) {
      config.l = Number(argv[++i]);
    }
  }
  return config;
}

function progress() {
  // Write your code here
  // Simulate progress bar from 0% to 100% over ~5 seconds
  // Update in place using \r every 100ms
  // Format: [████████████████████          ] 67%
  
  const config = parseProgressArgs(process.argv.slice(2));
  createBar(config);
}

function createBar(config) {
  const { d, i, l } = config;

  const progressCalc = createProgressCalculator({
    duration: d,
    interval: i,
    length: l,
  });

  const { calculate, interval, duration } = progressCalc;
  const start = Date.now();

  const timer = setInterval(() => {
    const elapsed = Date.now() - start;
    const { percent, filled, empty } = calculate(elapsed);

    const bar = `[${'█'.repeat(filled)}${' '.repeat(empty)}] ${percent}%`;
    process.stdout.write('\r' + bar);

    if (elapsed >= duration) {
      clearInterval(timer);
      process.stdout.write('\nDone!\n');
    }
  }, interval);
}

function createProgressCalculator(
  { duration = 5000, interval = 100, length = 30 } = {}
) {
  duration = Math.max(1, Number(duration));
  interval = Math.max(1, Number(interval));
  length = Math.max(1, Number(length));

  const calculate = (elapsed) => {
    const clamped = Math.min(Math.max(elapsed, 0), duration);
    const progress = clamped / duration;

    return {
      elapsed: clamped,
      progress,
      percent: Math.floor(progress * 100),
      filled: Math.floor(progress * length),
      empty: length - Math.floor(progress * length),
    };
  };

  return { duration, interval, length, calculate };
}

progress();
