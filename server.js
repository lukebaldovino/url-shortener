const express = require('express');
const {body, validationResult} = require('express-validator');
const fs = require('fs');
const path = require('path');


const app = express();


function removeExpiredLinksPeriodically() {
  setInterval(async () => {
    try {
      await removeExpiredLinks();
      console.log('Expired links removed');
    } catch (error) {
      console.error('Error removing expired links:', error);
    }
  }, 60*60*1000); // Run every hour
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

removeExpiredLinks();

removeExpiredLinksPeriodically();

function generateShortCode() {
  const words =  ["skibidi",
  "sigma",
  "rizz",
  "gyatt",
  "ohio",
  "goofy",
  "sus",
  "mog",
  "fanum",
  "tax",
  "npc",
  "grimace",
  "delulu",
  "aura",
  "cooked",
  "bussin",
  "gooner",
  "brainrot",
  "yeet",
  "based"];
 const firstWord = words[Math.floor(Math.random() * words.length)];
  const secondWord = words[Math.floor(Math.random() * words.length)];
  const shortCode = `${firstWord}-${secondWord}-${Math.floor(Math.random() * 10000)}`;
  return shortCode;
}

function isExpired(link) {
  const now = new Date();
  const expirationDate = new Date(link.ExpiresAt);
  return now >= expirationDate;
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
    createdAt: new Date().toISOString(),
    ExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Expires in 30 days
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

async function removeExpiredLinks() {
  const data = await loadData();
  const now = new Date();
  const filteredData = data.filter(item => new Date(item.ExpiresAt) > now);
  await saveAllData(filteredData);
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
    if (isExpired(urlEntry)) {
      return res.status(410).send('This short link has expired');
    }
    res.redirect(urlEntry.url);
  } catch (error) {
    res.status(404).send('Short code not found');
  }
});

