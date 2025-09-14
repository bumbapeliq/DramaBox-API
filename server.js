import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { token } from './get-token.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.get('/api/latest', async (req, res) => {
  try {
    const gettoken = await token();
    const url = "https://sapi.dramaboxdb.com/drama-box/he001/theater";

    const headers = {
      "User-Agent": "okhttp/4.10.0",
      "Accept-Encoding": "gzip",
      "Content-Type": "application/json",
      "tn": `Bearer ${gettoken.token}`,
      "version": "430",
      "vn": "4.3.0",
      "cid": "DRA1000042",
      "package-name": "com.storymatrix.drama",
      "apn": "1",
      "device-id": gettoken.deviceid,
      "language": "in",
      "current-language": "in",
      "p": "43",
      "time-zone": "+0800",
      "content-type": "application/json; charset=UTF-8"
    };

    const data = {
      newChannelStyle: 1,
      isNeedRank: 1,
      pageNo: parseInt(req.query.page) || 1,
      index: 1,
      channelId: 43
    };

    const response = await axios.post(url, data, { headers });
    res.json(response.data.data.newTheaterList.records);
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

    const gettoken = await token();
    const url = "https://sapi.dramaboxdb.com/drama-box/search/suggest";

    const headers = {
      "User-Agent": "okhttp/4.10.0",
      "Accept-Encoding": "gzip",
      "Content-Type": "application/json",
      "tn": `Bearer ${gettoken.token}`,
      "version": "430",
      "vn": "4.3.0",
      "cid": "DRA1000042",
      "package-name": "com.storymatrix.drama",
      "apn": "1",
      "device-id": gettoken.deviceid,
      "language": "in",
      "current-language": "in",
      "p": "43",
      "time-zone": "+0800",
      "content-type": "application/json; charset=UTF-8"
    };

    const data = { keyword };
    const response = await axios.post(url, data, { headers });
    res.json(response.data.data.suggestList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to search dramas' });
  }
});

app.get('/api/stream/:bookId/:episode', async (req, res) => {
  try {
    const { bookId, episode } = req.params;
    const gettoken = await token();
    const url = "https://sapi.dramaboxdb.com/drama-box/chapterv2/batch/load";

    const headers = {
      "User-Agent": "okhttp/4.10.0",
      "Accept-Encoding": "gzip",
      "Content-Type": "application/json",
      "tn": `Bearer ${gettoken.token}`,
      "version": "430",
      "vn": "4.3.0",
      "cid": "DRA1000000",
      "package-name": "com.storymatrix.drama",
      "apn": "1",
      "device-id": gettoken.deviceid,
      "language": "in",
      "current-language": "in",
      "p": "43",
      "time-zone": "+0800",
      "content-type": "application/json; charset=UTF-8"
    };

    const data = {
      boundaryIndex: 0,
      comingPlaySectionId: -1,
      index: parseInt(episode),
      currencyPlaySource: "discover_new_rec_new",
      needEndRecommend: 0,
      currencyPlaySourceName: "",
      preLoad: false,
      rid: "",
      pullCid: "",
      loadDirection: 0,
      startUpKey: "",
      bookId: bookId
    };

    const response = await axios.post(url, data, { headers });
    const chapterList = response.data.data.chapterList;
    
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