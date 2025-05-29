const fs = require('fs');
const jsyaml = require('js-yaml');
const path = require('path');

async function main() {
  try {
    const dataFile = path.join(__dirname, 'data.yml');
    const fileContent = fs.readFileSync(dataFile, 'utf8');
    const data = jsyaml.load(fileContent);

    fs.writeFileSync(path.join(__dirname, 'api.json'), JSON.stringify(data, null, 2));
    console.log('JSON file generated successfully!');
  } catch (error) {
    console.error('Error generating JSON file:', error);
    process.exit(1);
  }
}

main();
