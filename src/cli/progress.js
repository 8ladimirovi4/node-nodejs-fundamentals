const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

function parseHexColor(hex) {
  if (!hex || !HEX_COLOR_REGEX.test(hex)) return null;
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function hexToAnsi(hex) {
  const rgb = parseHexColor(hex);
  if (!rgb) return '';
  return `\x1b[38;2;${rgb.r};${rgb.g};${rgb.b}m`;
}

function parseProgressArgs(argv) {
  const config = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--duration' && argv[i + 1] != null) {
      config.d = Number(argv[++i]);
    } else if (argv[i] === '--interval' && argv[i + 1] != null) {
      config.i = Number(argv[++i]);
    } else if (argv[i] === '--length' && argv[i + 1] != null) {
      config.l = Number(argv[++i]);
    } else if (argv[i] === '--color' && argv[i + 1] != null) {
      config.color = argv[++i];
    }
  }
  return config;
}

function progress() {
  const config = parseProgressArgs(process.argv.slice(2));
  createBar(config);
}

function createBar(config) {
  const { d, i, l, color } = config;

  const progressCalc = createProgressCalculator({
    duration: d,
    interval: i,
    length: l,
  });

  const colorCode = hexToAnsi(color);
  const resetCode = '\x1b[0m';

  const { calculate, interval, duration } = progressCalc;
  const start = Date.now();

  const timer = setInterval(() => {
    const elapsed = Date.now() - start;
    const { percent, filled, empty } = calculate(elapsed);

    const filledPart = '█'.repeat(filled);
    const coloredFilled = colorCode
      ? `${colorCode}${filledPart}${resetCode}`
      : filledPart;
    const bar = `[${coloredFilled}${' '.repeat(empty)}] ${percent}%`;
    process.stdout.write('\r' + bar);

    if (elapsed >= duration) {
      clearInterval(timer);
      process.stdout.write('\nDone!\n');
    }
  }, interval);
}

function createProgressCalculator({
  duration = 5000,
  interval = 100,
  length = 30,
} = {}) {
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
