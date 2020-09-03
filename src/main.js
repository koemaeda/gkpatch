#!/usr/bin/env node
const program = require('commander');
const chalk = require('chalk');
const path = require('path');
const recursive = require('recursive-readdir');
const minimatch = require('minimatch');
const PropertiesFilePair = require('./PropertiesFilePair');
const XmlFilePair = require('./XmlFilePair');

function createFilePair(paths) {
  const fileName = path.basename(paths.relativePath);
  if (minimatch(fileName, '*.properties'))
    return new PropertiesFilePair(paths);
  else if (minimatch(fileName, '*.xml'))
    return new XmlFilePair(paths);
  else
    return paths.relativePath;
}

async function main(methodName, leftPath, rightPath, outputPath) {
  // Get list of all files in both directories
  const leftFiles = (await recursive(leftPath)).map(f => path.relative(leftPath, f));
  const rightFiles = rightPath
    ? (await recursive(rightPath)).map(f => path.relative(rightPath, f))
    : [];
  const files = [
    ...leftFiles.map(f => createFilePair({
      relativePath: f,
      leftBasePath: leftPath,
      rightBasePath: rightPath,
      outputPath: outputPath
    })),
    ...rightFiles.filter(f => leftFiles.indexOf(f) === -1)
      .map(f => createFilePair({
        relativePath: f,
        leftBasePath: leftPath,
        rightBasePath: rightPath,
        outputPath: outputPath
      }))
  ];

  console.log(`Processing ${files.length} files`);
  let processedFiles = 0;

  for (file of files) {
    if (++processedFiles % 50 === 0) {
      const progress = Math.round((processedFiles * 100) / files.length);
      console.log(`... ${progress}% (${processedFiles} files processed)`);
    }

    if (!program.withlanguage && /_[a-z]{2}(_[A-Z]{2})?.properties$/.test(file.fileName)) {
      console.log(chalk.grey(`  Ignored file: ${file}`));
      continue; // skip language files
    }

    if (file && file[methodName]) {
      if (program.verbose)
        console.log(`  Processing ${file.relativePath} (${file.constructor.name})`);

      let result = file[methodName].apply(file);
      if (result instanceof Promise)
        await result;
    }
    else
      if (program.verbose)
        console.log(chalk.grey(`  Ignored file: ${file}`));
  }

  console.log(chalk.green(`Finished.`));
}


program
  .name('gk-patch-generator')
  .description('Property/XML file comparison and patch generation tool for GK custom templates')
  .option('-v, --verbose', 'Verbose output')
  .option('--overwrite', 'Overwrite existing files (ignored by default)')
  .option('--withlanguage', 'Process language files')
  .option('--ignoredeleted', 'Ignore deleted properties/elements')
  .option('--ignorenew', 'Ignore new properties/elements');

program
  .command('c14n')
  .description('Canonicalize .properties and .xml files and save them')
  .arguments("<input-path> <output-path>")
  .action((inputPath, outputPath) => main('canonicalize', inputPath, null, outputPath));

program
  .command('compare')
  .description('Compare files based on their content')
  .arguments("<left-path> <right-path>")
  .action((leftPath, rightPath) => main('compare', leftPath, rightPath));

program
  .command('patch')
  .description('Generate .patch files')
  .arguments("<left-path> <right-path> <output-path>")
  .action((leftPath, rightPath, outputPath) => main('patch', leftPath, rightPath, outputPath));

program.parse(process.argv);