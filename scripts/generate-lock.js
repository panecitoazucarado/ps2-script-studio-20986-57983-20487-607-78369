const fs = require('fs');
const path = require('path');

// Read package.json
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

// Create a minimal package-lock.json structure that npm can use
const lockfile = {
  "name": packageJson.name,
  "version": packageJson.version,
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": packageJson.name,
      "version": packageJson.version,
      "dependencies": packageJson.dependencies,
      "devDependencies": packageJson.devDependencies
    }
  }
};

fs.writeFileSync(
  path.join(__dirname, '../package-lock.json'),
  JSON.stringify(lockfile, null, 2)
);

console.log('package-lock.json has been regenerated');
