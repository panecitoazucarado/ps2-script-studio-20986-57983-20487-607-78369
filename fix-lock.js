const fs = require('fs');
const path = require('path');

const lockPath = path.join(__dirname, 'package-lock.json');

try {
  // Remove the lockfile if it exists
  if (fs.existsSync(lockPath)) {
    fs.unlinkSync(lockPath);
    console.log('[v0] package-lock.json removed successfully');
  }
  
  // The system will regenerate it automatically
  console.log('[v0] System will regenerate package-lock.json on next npm install');
  process.exit(0);
} catch (error) {
  console.error('[v0] Error:', error.message);
  process.exit(1);
}
