require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const Groq = require('groq-sdk');

const app = express();
const PORT = 5001; // Port changed to 5001 to avoid macOS conflict

// Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// CORS setup
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Ensure folders exist
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
if (!fs.existsSync('db.json')) fs.writeFileSync('db.json', JSON.stringify({ transcriptions: [] }));

// Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage: storage });

// Upload Route
app.post('/upload', upload.single('audio'), async (req, res) => {
  console.log("🔥 Request hit the backend!");
  
  try {
    if (!req.file) return res.status(400).json({ message: 'No file selected!' });

    console.log("Processing file with Groq:", req.file.path);

    // Groq Transcription
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: "whisper-large-v3",
      response_format: "text",
    });

    // Update DB
    const db = JSON.parse(fs.readFileSync('db.json', 'utf8'));
    db.transcriptions.push({
      audioPath: req.file.path,
      transcription: transcription,
      timestamp: new Date().toISOString()
    });
    fs.writeFileSync('db.json', JSON.stringify(db, null, 2));

    res.status(200).json({ transcription: transcription });
  } catch (error) {
    console.error("❌ Groq Error:", error);
    res.status(500).json({ message: 'Error', error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});