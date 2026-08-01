import {PrismaClient} from '@prisma/client';

const prisma = new PrismaClient();
const express = require('express');
const {body, validationResult} = require('express-validator');



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

async function generateUniqueShortCode() {
  let shortCode;
  let exists;
  do {
    shortCode = generateShortCode();
    exists = await prisma.url.findUnique({
      where: { shortCode }
    });
  } while (exists);
  return shortCode;
}
/*
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
}*/

async function updateClickData(shortCode) {
await prisma.url.update({
    where: { shortCode },
    data: { clicks: { increment: 1 } }
  });
}

async function removeExpiredLinks() {
    const deletedLinks = await prisma.url.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });
    return deletedLinks.count;
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
    await prisma.url.create({
      data: {
        shortCode,
        url,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Expires in 30 days
      }
    })
  } catch (error) {
    res.status(500).send('Failed to shorten URL');
  }
});


app.get('/:shortCode', async (req, res) => {
  const { shortCode } = req.params;
  try {
    const urlEntry = await prisma.url.findUnique({
      where: { shortCode }
    });
    if (!urlEntry) {
      return res.status(404).send('Short code not found');
    }
    if (urlEntry.expiresAt < new Date()) {
      await removeExpiredLinks(); // Remove expired links from the database
      return res.status(410).send('This link has expired');
    }
    await updateClickData(shortCode);
    res.redirect(urlEntry.url);
  } catch (error) {
    res.status(500).send('Failed to retrieve URL');
  }
});

