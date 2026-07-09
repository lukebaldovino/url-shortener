const express = require('express');
const {body, validationResult} = require('express-validator');
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

async function loadData() {
  const filePath = path.join(__dirname, 'urls.json');
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([]));
  }
  const data = await fs.promises.readFile(filePath, 'utf8');
  return JSON.parse(data); 
}

async function saveData(shortCode, url) {
  const loadedData = await loadData();
  loadedData.push({ shortCode, url });
  const filePath = path.join(__dirname, 'urls.json');
  await fs.promises.writeFile(filePath, JSON.stringify(loadedData, null, 2));
}

app.post('/shorten', [
  body('url').trim().isURL({
    protocols: ['http', 'https'],
    require_protocol: true,
    require_valid_protocol: true
  }).withMessage('Please provide a valid URL')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const{ url } = req.body;
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