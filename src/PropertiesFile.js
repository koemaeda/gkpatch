const program = require('commander');
const javaProps = require('java-props');
const propUtils = require('java-props/dist/utils');

function escapePropertyValue(value) {
  return value.replace(/([\:=])/g, '\$1');
}

module.exports = class PropertiesFile {

  constructor(filePath) {
    this.filePath = filePath;
  }

  async parse() {
    return javaProps.parseFile(this.filePath)
      .then(obj => {
        if (program.verbose)
          console.log(`    ${Object.keys(obj).length} properties read`);
        this.properties = obj;
      });
  }

  canonicalize() {
    return Object.keys(this.properties)
      .sort() // alphabetically sorted keys
      .map(key => key + '=' + escapePropertyValue(this.properties[key]))
      .join('\r\n');
  }

  compare(otherPropertiesFile) {
    let result = [
      // Different and left-only
      ...Object.keys(this.properties)
        .filter(key => this.properties[key] !== otherPropertiesFile.properties[key])
        .map(key => ({
          key: key,
          leftValue: propUtils.encodeLine(this.properties[key]),
          rightValue: otherPropertiesFile.properties[key]
            ? propUtils.encodeLine(otherPropertiesFile.properties[key])
            : undefined
        })),

      // Right-only
      ...Object.keys(otherPropertiesFile.properties)
        .filter(key => this.properties[key] === undefined)
        .map(key => ({
          key: key,
          leftValue: undefined,
          rightValue: propUtils.encodeLine(otherPropertiesFile.properties[key])
        }))
    ];

    if (program.ignoredeleted)
      result = result.filter(e => e.rightValue !== undefined)

    if (program.ignorenew)
      result = result.filter(e => e.leftValue !== undefined)

    return result;
  }

  keyExists(key) {
    return Object.keys(this.properties).indexOf(key) !== -1;
  }

  getKeyBefore(key) {
    const allKeys = Object.keys(this.properties);
    const beforeIndex = allKeys.indexOf(key) - 1;
    return (beforeIndex >= 0 && allKeys.length > beforeIndex)
      ? allKeys[beforeIndex] : undefined;
  }

  getKeyAfter(key) {
    const allKeys = Object.keys(this.properties);
    if (allKeys.indexOf(key) === -1)
      return undefined;
    const afterIndex = allKeys.indexOf(key) + 1;
    return (allKeys.length > afterIndex)
      ? allKeys[afterIndex] : undefined;
  }

}
