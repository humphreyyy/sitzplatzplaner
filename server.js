import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for large data

// Helper to ensure data file exists
const ensureDataFile = async () => {
    try {
        await fs.access(DATA_FILE);
    } catch (error) {
        // File doesn't exist, create it with default empty structure
        const defaultData = {
            rooms: [],
            seats: [],
            students: [],
            assignments: {}
        };
        await fs.writeFile(DATA_FILE, JSON.stringify(defaultData, null, 2));
    }
};

// GET /api/data
app.get('/api/data', async (req, res) => {
    try {
        await ensureDataFile();
        const data = await fs.readFile(DATA_FILE, 'utf-8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading data:', error);
        res.status(500).json({ error: 'Failed to read data' });
    }
});

// POST /api/data
app.post('/api/data', async (req, res) => {
    try {
        const data = req.body;
        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
        res.json({ success: true });
    } catch (error) {
        console.error('Error writing data:', error);
        res.status(500).json({ error: 'Failed to save data' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
