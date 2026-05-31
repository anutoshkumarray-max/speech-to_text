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

app.use(cors({
  origin: '*'
}));

app.use(express.json());

// -------------------- UPLOAD FOLDER --------------------
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// -------------------- MONGOOSE FIX --------------------
mongoose.set("strictQuery", false);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URI, {
      serverSelectionTimeoutMS: 30000
    });
    console.log("✅ MongoDB Connected Successfully");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);

    // retry after 5 sec (important fix)
    setTimeout(connectDB, 5000);
  }
};

connectDB();

// -------------------- MULTER --------------------
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

// -------------------- GROQ --------------------
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// -------------------- ROUTES --------------------
app.get('/', (req, res) => {
  res.send('Server Running');
});

// -------------------- UPLOAD API --------------------
app.post('/upload', upload.single('audio'), async (req, res) => {
  console.log('📥 Request received at /upload');

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: 'whisper-large-v3'
    });

    // save to DB
    const newEntry = new Transcription({
      text: transcription.text,
      audioPath: req.file.path
    });

    await newEntry.save();

    // delete file after use
    fs.unlinkSync(req.file.path);

    res.json({
      transcription: transcription.text
    });

  } catch (error) {
    console.error("❌ Upload Error:", error.message);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: error.message
    });
  }
});

// -------------------- HISTORY --------------------
app.get('/history', async (req, res) => {
  try {
    const history = await Transcription.find().sort({ createdAt: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------- SERVER --------------------
const PORT = process.env.PORT || 5001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});