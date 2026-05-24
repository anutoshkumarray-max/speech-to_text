const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs'); // Filesystem module for saving data
const path = require('path');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage: storage });

// Upload route
app.post('/upload', upload.single('audio'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file selected!' });
  }

  // Create data object
  const newEntry = {
    audioPath: req.file.path,
    timestamp: new Date().toISOString()
  };

  // Read current data, add new entry, and save back to db.json
  const db = JSON.parse(fs.readFileSync('db.json', 'utf8'));
  db.transcriptions.push(newEntry);
  fs.writeFileSync('db.json', JSON.stringify(db, null, 2));

  res.status(200).json({ 
    message: 'File uploaded and saved locally to db.json!', 
    filePath: req.file.path 
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});