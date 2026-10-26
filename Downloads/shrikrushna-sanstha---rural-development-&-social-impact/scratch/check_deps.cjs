const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
console.log('package.json dependencies.vite:', pkg.dependencies ? pkg.dependencies.vite : undefined);
console.log('package.json devDependencies.vite:', pkg.devDependencies ? pkg.devDependencies.vite : undefined);

try {
  const vpkg = JSON.parse(fs.readFileSync('./node_modules/vite/package.json', 'utf8'));
  console.log('installed node_modules/vite/package.json version:', vpkg.version);
} catch (e) {
  console.log('Error reading node_modules/vite/package.json:', e.message);
}

try {
  const lock = JSON.parse(fs.readFileSync('./package-lock.json', 'utf8'));
  console.log('package-lock.json vite version:', lock.packages && lock.packages['node_modules/vite'] ? lock.packages['node_modules/vite'].version : (lock.dependencies && lock.dependencies.vite ? lock.dependencies.vite.version : 'not found in lock'));
} catch (e) {
  console.log('Error reading package-lock.json:', e.message);
}
