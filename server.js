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
async function generateUniqueShortCode() {
  let shortCode;
  const data = await loadData();
  do {
    shortCode = generateShortCode();
  } while (data.some(item => item.shortCode === shortCode));
  return shortCode;
}

async function loadData() {
  const filePath = path.join(__dirname, 'urls.json');
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([]));
    return [];
  }
  try {
    const data = await fs.promises.readFile(filePath, 'utf8');
    return data.trim() ? JSON.parse(data) : [];
  } catch (error) {
    throw new Error('Failed to read urls.json');
  }
}

async function saveAllData(data) {
  const filePath = path.join(__dirname, 'urls.json');
  await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
}

async function saveData(shortCode, url) {
  const loadedData = await loadData();
  const urlEntry = {
    shortCode: shortCode,
    url: url,
    clicks: 0,
    createdAt: new Date().toISOString()
  }
  loadedData.push(urlEntry);
  await saveAllData(loadedData);
}

async function updateClickData(shortCode) {
  const data = await loadData();
  const urlEntry = data.find(item => item.shortCode === shortCode);
  if (urlEntry) {
    urlEntry.clicks += 1;
    await saveAllData(data);
    return urlEntry;
  }

  throw new Error('Short code not found');
}


app.post('/shorten', [
  body('url').trim().isURL({
    protocols: ['http', 'https'],
    require_protocol: true,
    require_valid_protocol: true
  }).withMessage('Please provide a valid URL')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { url } = req.body;
    const shortCode = await generateUniqueShortCode();
    await saveData(shortCode, url);
    res.json({ shortCode });
  } catch (error) {
    res.status(500).send('Failed to shorten URL');
  }
});


app.get('/:shortCode', async (req, res) => {
  const { shortCode } = req.params;
  try {
    const urlEntry = await updateClickData(shortCode);
    res.redirect(urlEntry.url);
  } catch (error) {
    res.status(404).send('Short code not found');
  }
});

