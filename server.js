const express = require('express');
const fs = require('fs');
const path = require('path');


const app = express();

app.use(express.json());

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

function generateShortCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = 6;
  let shortCode = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    shortCode += characters[randomIndex];
  }
  return shortCode;
}
function generateUniqueShortCode() {
  let shortCode;
  const data = loadData();
  do {
    shortCode = generateShortCode();
  } while (data.some(item => item.shortCode === shortCode));
  return shortCode;
}

function loadData() {
  const filePath = path.join(__dirname, 'urls.json');
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([]));
  }
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data); 
}

function saveData(shortCode, url) {
  const loadedData = loadData();
  loadedData.push({ shortCode, url });
  const filePath = path.join(__dirname, 'urls.json');
  fs.writeFileSync(filePath, JSON.stringify(loadedData, null, 2));
}

app.post('/shorten', (req, res) => {
    const{ url } = req.body;
    const data = loadData();
    const shortCode = generateUniqueShortCode();
    saveData(shortCode, url);
    res.json({ shortCode });
});

app.get('/:shortCode', (req, res) => {
  const { shortCode } = req.params;
  const data = loadData();
  const url = data.find(item => item.shortCode === shortCode);
  if (url) {
    res.redirect(url.url);
  } else {
    res.status(404).send('Short code not found');
  }
});