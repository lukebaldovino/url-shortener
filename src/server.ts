import 'dotenv/config';
import express from 'express';
import path from 'path';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import type { Request, Response } from 'express';
import rateLimit from "express-rate-limit";
import helmet from 'helmet';


const createUrlLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 10, 
  standardHeaders: true, 
  legacyHeaders: false,
  message: {
    error: "Too many requests, try again later"
  }
});

const redirectLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests, try again later"
  }
});

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const app = express();


app.use(helmet());
app.use(express.json());

app.use(express.static(path.join(process.cwd(), 'public')));

function removeExpiredLinksPeriodically(): void {
  setInterval(async () => {
    try {
      await removeExpiredLinks().then((count) => {
        if (count > 0) {
          console.log(`Removed ${count} expired links`);
        }
      });
    } catch (error) {
      console.error('Error removing expired links:', error);
    }
  }, 60 * 60 * 1000);
}

function generateShortCode(): string {
  const words = [
    'skibidi',
    'sigma',
    'rizz',
    'gyatt',
    'ohio',
    'goofy',
    'sus',
    'mog',
    'fanum',
    'tax',
    'npc',
    'grimace',
    'delulu',
    'aura',
    'cooked',
    'bussin',
    'gooner',
    'brainrot',
    'yeet',
    'based'
  ];

  const firstWord = words[Math.floor(Math.random() * words.length)];
  const secondWord = words[Math.floor(Math.random() * words.length)];
  return `${firstWord}-${secondWord}-${Math.floor(Math.random() * 10000)}`;
}

async function generateUniqueShortCode(): Promise<string> {
  let shortCode: string;
  let exists: { shortCode: string } | null;

  do {
    shortCode = generateShortCode();
    exists = await prisma.url.findUnique({
      where: { shortCode },
      select: { shortCode: true }
    });
  } while (exists);

  return shortCode;
}

async function updateClickData(shortCode: string): Promise<void> {
  await prisma.url.update({
    where: { shortCode },
    data: { clicks: { increment: 1 } }
  });
}

async function removeExpiredLinks(): Promise<number> {
  const deletedLinks = await prisma.url.deleteMany({
    where: {
      expiresAt: {
        lt: new Date()
      }
    }
  });

  return deletedLinks.count;
}

app.post(
  '/shorten', createUrlLimiter,
  [
    body('url')
      .trim()
      .isURL({
        protocols: ['http', 'https'],
        require_protocol: true,
        require_valid_protocol: true
      })
      .withMessage('Please provide a valid URL')
  ],
  async (req: Request<{}, {}, { url: string }>, res: Response) => {
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
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });

      return res.status(201).json({ shortCode });
    } catch (error) {
      return res.status(500).send('Failed to shorten URL');
    }
  }
);

app.get('/:shortCode', redirectLimiter, async (req: Request<{ shortCode: string }>, res: Response) => {
  const { shortCode } = req.params;

  try {
    const urlEntry = await prisma.url.findUnique({
      where: { shortCode }
    });

    if (!urlEntry) {
      return res.status(404).send('Short code not found');
    }

    if (urlEntry.expiresAt < new Date()) {
      await removeExpiredLinks();
      return res.status(410).send('This link has expired');
    }

    await updateClickData(shortCode);
    return res.redirect(urlEntry.url);
  } catch (error) {
    return res.status(500).send('Failed to retrieve URL');
  }
});

app.listen(3000, async () => {
  await removeExpiredLinks();
  removeExpiredLinksPeriodically();
  console.log('Server is running on port 3000');
});


