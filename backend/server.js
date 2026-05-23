const express = require('express');
const multer = require('multer');
const cors = require('cors');
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
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } 
});
app.post('/upload', upload.single('audio'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file selected!' });
    }
    res.status(200).json({ 
      message: 'File uploaded successfully!', 
      filePath: req.file.path 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error during file upload', error });
  }
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});