const fs = require('fs');

/**
 * Transcribes an audio file using OpenAI Whisper model.
 * @param {string} filePath - Path to the uploaded audio file.
 * @param {object} openai - Initialized OpenAI client instance.
 * @returns {Promise<string>} - The transcribed text.
 */
async function transcribeAudio(filePath, openai) {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error("Audio file not found at path: " + filePath);
    }

    // Call OpenAI Whisper model
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-1",
    });

    return transcription.text;
  } catch (error) {
    console.error("Error in transcribeAudio:", error);
    throw error; // Rethrow to be caught by server.js
  }
}

module.exports = { transcribeAudio };