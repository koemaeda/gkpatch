const program = require('commander');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

module.exports = class FilePair {

  constructor(paths) {
    this.relativePath = paths.relativePath;
    this.fileName = path.basename(this.relativePath);

    this.leftBasePath = paths.leftBasePath;
    this.rightBasePath = paths.rightBasePath;

    this.fullLeftPath = path.resolve(this.leftBasePath, this.relativePath);
    if (! fs.existsSync(this.fullLeftPath))
      this.fullLeftPath = undefined;

    if (this.rightBasePath) {
      this.fullRightPath = path.resolve(this.rightBasePath, this.relativePath);
      if (! fs.existsSync(this.fullRightPath))
        this.fullRightPath = undefined;
    }

    this.outputPath = paths.outputPath;
    this.fullOutputPath = paths.outputPath ? path.resolve(paths.outputPath, this.relativePath) : undefined
  }

  save(contents, toPath) {
    toPath = toPath || this.fullOutputPath;
    if (!program.overwrite && fs.existsSync(toPath)) {
      console.error(chalk.red(`  File ${toPath} already exists. Use --overwrite to overwrite.`));
      return;
    }

    fs.mkdirSync(path.dirname(toPath), { recursive: true });
    fs.writeFileSync(toPath, contents);
    if (program.verbose)
      console.log(chalk.green(`    Saved: ${toPath}`));
  }

  copy(fromPath, toPath) {
    toPath = toPath || this.fullOutputPath;
    if (!program.overwrite && fs.existsSync(toPath)) {
      console.error(chalk.red(`  File ${toPath} already exists. Use --overwrite to overwrite.`));
      return;
    }
    fs.mkdirSync(path.dirname(toPath), { recursive: true });
    fs.copyFileSync(fromPath, toPath);
    if (program.verbose)
      console.log(chalk.green(`    Copied to: ${toPath}`));
  }

};