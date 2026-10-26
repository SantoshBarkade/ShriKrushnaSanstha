async function checkApi() {
  try {
    const res = await fetch('http://localhost:5173/api/content.php?resource=gallery');
    console.log('/api/content.php?resource=gallery status:', res.status);
    const json = await res.json();
    console.log('gallery json length:', Array.isArray(json) ? json.length : json);
  } catch (e) {
    console.log('Error testing /api/content.php?resource=gallery:', e.message);
  }

  try {
    const res = await fetch('http://localhost:5173/api/content.php?bundle=1');
    console.log('/api/content.php?bundle=1 status:', res.status);
    const json = await res.json();
    console.log('bundle gallery:', json.gallery ? json.gallery.length : 'none');
    console.log('bundle albums:', json.albums ? json.albums.length : 'none');
  } catch (e) {
    console.log('Error testing bundle:', e.message);
  }
}

checkApi();
