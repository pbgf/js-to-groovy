#!/usr/bin/env node

const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const JSToGroovyTranspiler = require('../src/index');

const program = new Command();

program.name('js2groovy').description('JavaScript to Groovy code transpiler').version('1.0.0');

program
  .argument('<input>', 'JavaScript input file path')
  .option('-o, --output <output>', 'Output file path')
  .option('-v, --verbose', 'Show verbose information')
  .action((input, options) => {
    try {
      const inputPath = path.resolve(input);
      if (!fs.existsSync(inputPath)) {
        console.error(`Error: Input file not found: ${inputPath}`);
        process.exit(1);
      }

      const jsCode = fs.readFileSync(inputPath, 'utf8');

      if (options.verbose) {
        console.log(`Transpiling file: ${inputPath}`);
      }

      const transpiler = new JSToGroovyTranspiler();
      const groovyCode = transpiler.transpile(jsCode);

      if (options.output) {
        const outputPath = path.resolve(options.output);
        fs.writeFileSync(outputPath, groovyCode, 'utf8');
        console.log(`Transpilation complete, output file: ${outputPath}`);
      } else {
        console.log('Transpilation result:');
        console.log('='.repeat(50));
        console.log(groovyCode);
        console.log('='.repeat(50));
      }
    } catch (error) {
      console.error(`Transpilation failed: ${error.message}`);
      process.exit(1);
    }
  });

program.parse();
