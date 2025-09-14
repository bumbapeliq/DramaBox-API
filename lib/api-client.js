import axios from 'axios';
import { token } from '../get-token.js';

class DramaBoxAPI {
    constructor() {
        this.baseURL = 'https://sapi.dramaboxdb.com/drama-box';
        this.retryCount = 3;
        this.retryDelay = 1000; // 1 second
    }

    async getHeaders() {
        const tokenData = await token();
        return {
            "User-Agent": "okhttp/4.10.0",
            "Accept-Encoding": "gzip",
            "Content-Type": "application/json",
            "tn": `Bearer ${tokenData.token}`,
            "version": "430",
            "vn": "4.3.0",
            "cid": "DRA1000042",
            "package-name": "com.storymatrix.drama",
            "apn": "1",
            "device-id": tokenData.deviceid,
            "language": "in",
            "current-language": "in",
            "p": "43",
            "time-zone": "+0800",
            "content-type": "application/json; charset=UTF-8"
        };
    }

    async makeRequest(endpoint, data, retryCount = 0) {
        try {
            const headers = await this.getHeaders();
            const url = `${this.baseURL}${endpoint}`;
            
            const response = await axios.post(url, data, { 
                headers,
                timeout: 15000 // 15 seconds timeout
            });
            
            return response.data;
        } catch (error) {
            console.error(`API request failed (attempt ${retryCount + 1}):`, error.message);
            
            // Retry logic
            if (retryCount < this.retryCount) {
                console.log(`Retrying in ${this.retryDelay}ms...`);
                await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                return this.makeRequest(endpoint, data, retryCount + 1);
            }
            
            throw error;
        }
    }

    async getLatestDramas(pageNo = 1) {
        const data = {
            newChannelStyle: 1,
            isNeedRank: 1,
            pageNo: pageNo,
            index: 1,
            channelId: 43
        };

        const response = await this.makeRequest('/he001/theater', data);
        return response.data?.newTheaterList?.records || [];
    }

    async searchDramas(keyword) {
        const data = { keyword };
        const response = await this.makeRequest('/search/suggest', data);
        return response.data?.suggestList || [];
    }

    async getStreamLink(bookId, episode) {
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

        // Use different CID for stream requests
        const tokenData = await token();
        const headers = {
            "User-Agent": "okhttp/4.10.0",
            "Accept-Encoding": "gzip",
            "Content-Type": "application/json",
            "tn": `Bearer ${tokenData.token}`,
            "version": "430",
            "vn": "4.3.0",
            "cid": "DRA1000000", // Different CID for stream
            "package-name": "com.storymatrix.drama",
            "apn": "1",
            "device-id": tokenData.deviceid,
            "language": "in",
            "current-language": "in",
            "p": "43",
            "time-zone": "+0800",
            "content-type": "application/json; charset=UTF-8"
        };

        const url = `${this.baseURL}/chapterv2/batch/load`;
        const response = await axios.post(url, data, { headers, timeout: 15000 });
        
        return response.data.data?.chapterList || [];
    }
}

// Create singleton instance
const apiClient = new DramaBoxAPI();

export default apiClient;