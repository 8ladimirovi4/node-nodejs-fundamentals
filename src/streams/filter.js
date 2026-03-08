import { Transform } from "stream";

const filter = () => {
  const args = process.argv;
  const patterns = filterInput(args);
  
  const hasPatternFlag = args.includes('--pattern');

  const transform = new Transform({
    transform(chunk, encoding, callback) {
      const lines = chunk.toString().split('\n'); 

      const result = hasPatternFlag 
        ? lines.filter(line => {
            if (!line.trim()) return false;
            return patterns.has(line.trim());
          })
        : lines;
        
      const output = result.length > 0 ? result.join('\n') + '\n' : '';
      
      callback(null, output);
    }
  });

  process.stdin
    .pipe(transform)
    .pipe(process.stdout);

  process.stdout.on('finish', () => process.exit(0));
};

filter();

function filterInput(inputs) {
  const set = new Set();
  if (!inputs) return set;

  const startIndex = inputs.indexOf('--pattern');

  if (startIndex !== -1) {
    for (let i = startIndex + 1; i < inputs.length; i++) {
      if (inputs[i]) {
        set.add(inputs[i]);
      }  
    }
  }
  
  return set;
}