import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { token } from './get-token.js';
import { refreshToken, getTokenInfo } from './lib/token-generator.js';
import apiClient from './lib/api-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Token management routes
app.get('/api/token/info', (req, res) => {
  try {
    const info = getTokenInfo();
    res.json(info);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get token info' });
  }
});

app.post('/api/token/refresh', async (req, res) => {
  try {
    const newToken = await refreshToken();
    res.json({ 
      message: 'Token refreshed successfully',
      token: newToken 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// API Routes
app.get('/api/latest', async (req, res) => {
  try {
    const pageNo = parseInt(req.query.page) || 1;
    const dramas = await apiClient.getLatestDramas(pageNo);
    res.json(dramas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch latest dramas' });
  }
});

app.get('/api/search', async (req, res) => {
  try {
    const keyword = req.query.q;
    if (!keyword) {
      return res.status(400).json({ error: 'Keyword is required' });
    }

    const dramas = await apiClient.searchDramas(keyword);
    res.json(dramas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to search dramas' });
  }
});

app.get('/api/stream/:bookId/:episode', async (req, res) => {
  try {
    const { bookId, episode } = req.params;
    const chapterList = await apiClient.getStreamLink(bookId, episode);
    
    if (chapterList && chapterList.length > 0) {
      res.json({
        streamUrl: chapterList[0].cdnList[0],
        chapterList: chapterList.map(chapter => ({
          index: chapter.index,
          title: chapter.title,
          duration: chapter.duration
        }))
      });
    } else {
      res.status(404).json({ error: 'Episode not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get stream link' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});