const program = require('commander');
const fs = require('fs');
const xmldom = require('xmldom');
const c14n = require('xml-c14n')();
const beautify = require('js-beautify').html;

const domParser = new xmldom.DOMParser();
const canonicaliser = c14n.createCanonicaliser('http://www.w3.org/2001/10/xml-exc-c14n#')

module.exports = class XmlFile {

  constructor(filePath) {
    this.filePath = filePath;
    this.xmlString = fs.readFileSync(filePath, 'utf8')
      .replace(/\r\n/g, '\n'); // normalize line-endings
    this.document = domParser.parseFromString(this.xmlString);
    this.removeEmptyTexts(this.document.documentElement);
    if (program.verbose)
      console.log(`    ${this.document.getElementsByTagName('*').length} nodes read (DOM)`);
  }

  removeEmptyTexts(node) {
    Array.from(node.childNodes || []).forEach(child => {
      // Remove empty text nodes (whitespaces ignored)
      if (child.constructor.name === 'Text' && child.data.trim().length === 0) {
        child.parentNode.removeChild(child);
        return;
      }
      this.removeEmptyTexts(child);
    });
  }

  async canonicalize() {
    return new Promise((resolve, reject) => {
      canonicaliser.canonicalise(this.document.documentElement, (err, res) => {
        if (err)
          return console.error(err);
        this.xmlString = res;
        resolve(this.xmlString);
      });
    });
  }

  beautify() {
    this.xmlString = beautify(this.xmlString, {
      indent_size: 2
    });
    return this.xmlString
      .split(/\n|\r\n/).join('\n'); // normalize line endings
  }

  compare(otherXmlFile) {
    // TODO
  }

}
