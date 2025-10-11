const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;

const initializeGemini = () => {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('Warning: GEMINI_API_KEY not set. AI features will be disabled.');
    return null;
  }

  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('Gemini AI initialized successfully');
    return genAI;
  } catch (error) {
    console.error('Failed to initialize Gemini AI:', error.message);
    return null;
  }
};

const getGeminiModel = (modelName = 'gemini-pro') => {
  if (!genAI) {
    genAI = initializeGemini();
  }

  if (!genAI) {
    throw new Error('Gemini AI is not available');
  }

  return genAI.getGenerativeModel({ model: modelName });
};

module.exports = {
  initializeGemini,
  getGeminiModel
};
