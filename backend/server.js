require('dotenv').config(); // Load environment variables from .env
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai'); // Import OpenAI
const { transcribeAudio } = require('./day4/transcribe'); // Import the function

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage: storage });

// Upload and Transcribe route
app.post('/upload', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file selected!' });
    }

    // Call the transcription function, passing the initialized openai client
    const text = await transcribeAudio(req.file.path, openai);

    // Save upload details and transcription to db.json
    const db = JSON.parse(fs.readFileSync('db.json', 'utf8'));
    
    const newEntry = {
      audioPath: req.file.path,
      transcriptionText: text,
      timestamp: new Date().toISOString()
    };

    db.transcriptions.push(newEntry);
    fs.writeFileSync('db.json', JSON.stringify(db, null, 2));

    res.status(200).json({ 
      message: 'File uploaded and transcribed successfully!', 
      transcription: text,
      filePath: req.file.path 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error during upload or transcription', error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});