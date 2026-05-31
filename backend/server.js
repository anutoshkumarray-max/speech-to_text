const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const Groq = require('groq-sdk');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Transcription = require('./models/Transcription');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.webm';
    cb(null, Date.now() + ext);
  }
});

const upload = multer({ storage });

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const DB_URI =
  'mongodb+srv://anutoshkumarray_db_user:I4TZ6erdBkcmq6f2@cluster0.mozpodn.mongodb.net/speechDB?appName=Cluster0';

mongoose
  .connect(DB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected Successfully');
  })
  .catch((err) => {
    console.error('❌ DB Connection Error:', err);
  });

app.get('/', (req, res) => {
  res.send('Server Running');
});

app.post('/upload', upload.single('audio'), async (req, res) => {
  console.log('📥 Request received at /upload');

  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded'
      });
    }

    console.log('📄 File Path:', req.file.path);
    console.log('📄 Original Name:', req.file.originalname);

    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: 'whisper-large-v3'
    });

    const newEntry = new Transcription({
      text: transcription.text,
      audioPath: req.file.path
    });

    await newEntry.save();

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
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
    const history = await Transcription.find().sort({
      timestamp: -1
    });

    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

app.listen(5001, '0.0.0.0', () => {
  console.log('🚀 Server running on port 5001');
});