const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const Groq = require('groq-sdk');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Transcription = require('./models/transcription');

const app = express();

// ---------------- MIDDLEWARE ----------------
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// ---------------- UPLOAD FOLDER ----------------
const uploadDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// ---------------- MULTER CONFIG ----------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.webm';
    cb(null, Date.now() + ext);
  }
});

const upload = multer({ storage });

// ---------------- GROQ INIT ----------------
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// ---------------- ROUTES ----------------
app.get('/', (req, res) => {
  res.send('Server Running 🚀');
});

app.post('/upload', upload.single('audio'), async (req, res) => {
  console.log('📥 Upload request received');

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;

    console.log('📄 File:', filePath);

    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: 'whisper-large-v3'
    });

    const newEntry = new Transcription({
      text: transcription.text,
      audioPath: filePath
    });

    await newEntry.save();

    // cleanup file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.status(200).json({
      transcription: transcription.text
    });

  } catch (error) {
    console.error('❌ Upload Error:', error);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: error.message || 'Internal Server Error'
    });
  }
});

app.get('/history', async (req, res) => {
  try {
    const history = await Transcription.find().sort({ createdAt: -1 });
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------- DB + SERVER START ----------------
const DB_URI = process.env.DB_URI; // ⚠️ DO NOT hardcode in production

async function startServer() {
  try {
    await mongoose.connect(DB_URI);
    console.log('✅ MongoDB Connected Successfully');

    const PORT = process.env.PORT || 5001;

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error('❌ DB Connection Failed:', err);
    process.exit(1);
  }
}

startServer();