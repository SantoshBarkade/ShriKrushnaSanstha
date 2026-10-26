const fs = require('fs');
const path = require('path');

const backupDir = path.resolve('backup_pre_recovery_20261026_033217');
const currentDir = path.resolve('.');

function compareFiles(relPath) {
  const currentPath = path.join(currentDir, relPath);
  const bkpPath = path.join(backupDir, relPath);

  if (!fs.existsSync(currentPath)) return { file: relPath, status: 'DELETED' };
  if (!fs.existsSync(bkpPath)) return { file: relPath, status: 'ADDED' };

  const currentStat = fs.statSync(currentPath);
  if (currentStat.isDirectory()) {
    const files = fs.readdirSync(currentPath);
    let results = [];
    for (const f of files) {
      if (['node_modules', '.git', 'dist', 'scratch', 'backup_pre_recovery_20261026_033217'].includes(f)) continue;
      results = results.concat(compareFiles(path.join(relPath, f)));
    }
    return results;
  }

  const curBuf = fs.readFileSync(currentPath);
  const bkpBuf = fs.readFileSync(bkpPath);
  if (!curBuf.equals(bkpBuf)) {
    return [{ file: relPath, status: 'MODIFIED', sizeDiff: curBuf.length - bkpBuf.length }];
  }
  return [];
}

const diffs = compareFiles('src');
console.log('Modified source files compared to pre-recovery backup:');
console.table(diffs);
