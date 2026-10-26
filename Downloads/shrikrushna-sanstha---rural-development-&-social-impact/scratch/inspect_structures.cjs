const fs = require('fs');

['test2_results.json', 'test3_results.json', 'test4_results.json', 'test5_results.json'].forEach(file => {
  console.log(`\n=== ${file} keys ===`);
  const data = JSON.parse(fs.readFileSync(`scratch/${file}`, 'utf8'));
  console.log(Array.isArray(data) ? `Array[${data.length}]` : Object.keys(data));
  if (Array.isArray(data)) {
    console.log("First item:", data[0]);
  } else {
    for (let k in data) {
      if (Array.isArray(data[k])) {
        console.log(`Key ${k}: Array[${data[k].length}], first item:`, data[k][0]);
      } else if (typeof data[k] === 'object' && data[k] !== null) {
        console.log(`Key ${k}: Object keys:`, Object.keys(data[k]));
      } else {
        console.log(`Key ${k}:`, data[k]);
      }
    }
  }
});
