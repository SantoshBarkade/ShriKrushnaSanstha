const fs = require('fs');

// Read initialData.ts
const text = fs.readFileSync('./src/data/initialData.ts', 'utf8');

// Match albums
const albumsMatch = text.match(/albums:\s*\[([\s\S]*?)\]\s*,/);
console.log('Albums found in initialData:', Boolean(albumsMatch));

// Match gallery
const galleryMatch = text.match(/gallery:\s*\[([\s\S]*?)\]\s*,/);
console.log('Gallery found in initialData:', Boolean(galleryMatch));

// Match videos
const videosMatch = text.match(/videos:\s*\[([\s\S]*?)\]\s*,/);
console.log('Videos found in initialData:', Boolean(videosMatch));
