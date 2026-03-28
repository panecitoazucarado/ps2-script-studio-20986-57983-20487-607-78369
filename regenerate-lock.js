#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Read the package.json from the current directory
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Create a minimal but valid package-lock.json structure
const packageLock = {
  name: packageJson.name,
  version: packageJson.version,
  lockfileVersion: 3,
  requires: true,
  packages: {
    "": {
      name: packageJson.name,
      version: packageJson.version,
      dependencies: packageJson.dependencies || {},
      devDependencies: packageJson.devDependencies || {}
    }
  }
};

// Write the package-lock.json
const lockfilePath = path.join(__dirname, 'package-lock.json');
fs.writeFileSync(lockfilePath, JSON.stringify(packageLock, null, 2));
console.log('✓ package-lock.json regenerated successfully');
