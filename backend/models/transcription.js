const mongoose = require('mongoose');

const transcriptionSchema = new mongoose.Schema({
    audioPath: String,
    transcriptionText: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transcription', transcriptionSchema);