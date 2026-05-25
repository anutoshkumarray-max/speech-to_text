const fs = require('fs');

/**
 * Transcribes an audio file using the provided OpenAI client instance.
 * @param {string} filePath - The path to the uploaded audio file.
 * @param {object} openaiClient - The initialized OpenAI client instance.
 * @returns {Promise<string>} - The transcribed text.
 */
async function transcribeAudio(filePath, openaiClient) {
  try {
    // Check if the file exists before processing
    if (!fs.existsSync(filePath)) {
      throw new Error("File not found at the specified path: " + filePath);
    }

    // Call the OpenAI Whisper API
    const transcription = await openaiClient.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: 'whisper-1',
    });
    
    // Return the result
    return transcription.text;
  } catch (error) {
    console.error("Error during transcription:", error);
    throw error;
  }
}

module.exports = { transcribeAudio };