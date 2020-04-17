const program = require('commander');
const chalk = require('chalk');
const path = require('path');
const jsDiff = require('diff');
const FilePair = require('./FilePair');
const XmlFile = require('./XmlFile');

module.exports = class XmlFilePair extends FilePair {

  async canonicalize() {
    const xml = new XmlFile(this.fullLeftPath);
    await xml.canonicalize();
    this.save(xml.beautify());
  }

  async compare() {
    let leftXml, rightXml;
    if (this.fullLeftPath) {
      const xml = new XmlFile(this.fullLeftPath);
      await xml.canonicalize();
      leftXml = xml.beautify();
    }
    if (this.fullRightPath) {
      const xml = new XmlFile(this.fullRightPath);
      await xml.canonicalize();
      rightXml = xml.beautify();
    }

    if (! this.fullLeftPath) {
      console.log(chalk.red(`Right only: ${this.relativePath}`));
      return;
    }
    else if (! this.fullRightPath) {
      console.log(chalk.green(`Left only: ${this.relativePath}`));
      return;
    }
    else if (leftXml !== rightXml)
      console.log(chalk.yellow(`Different: ${this.relativePath}`));
    else if (program.verbose)
      console.log(chalk.grey(`Identical: ${this.relativePath}`));

    // TODO - contents flag and proper diff
    // const diff = jsDiff.diffLines(leftXml, rightXml, {
    //   ignoreWhitespace: false,
    //   newlineIsToken: true
    // })
    // if (diff.filter(part => part.added | part.removed).length === 0) {
    //   if (program.verbose)
    //     console.log(chalk.grey(`Identical: ${this.relativePath}`));
    //   return;
    // }
  }

  async patch() {
    // TODO - proper DOM parsing and XPath patch
    // console.error(chalk.red(this.relativePath + ' - XML patching is not implemented!'));

    let leftXml, rightXml;
    if (this.fullLeftPath) {
      const xml = new XmlFile(this.fullLeftPath);
      await xml.canonicalize();
      leftXml = xml.beautify();
    }
    if (this.fullRightPath) {
      const xml = new XmlFile(this.fullRightPath);
      await xml.canonicalize();
      rightXml = xml.beautify();
    }

    if (this.fullLeftPath && leftXml !== rightXml) {
      if (program.verbose)
        console.log(chalk.green(`  Different: ${this.relativePath} -> copy to overwrite`));

      this.copy(this.fullLeftPath, path.resolve(this.outputPath, 'overwrite', this.relativePath));
    }
    else if (program.verbose)
      console.log(chalk.grey(`  Identical: ${this.relativePath}`));
  }

}
