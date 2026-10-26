const fs = require('fs');
const init = fs.readFileSync('src/data/initialData.ts', 'utf8');
const lines = init.split('\n');
let cur = {};
lines.forEach(l => {
  if (l.includes("id: 'init-")) cur.id = l.trim();
  if (l.includes("title:") && !l.includes("titleEn")) cur.title = l.trim();
  if (l.includes("category:")) cur.category = l.trim();
  if (l.includes("date:")) { cur.date = l.trim(); console.log(cur); cur = {}; }
});
