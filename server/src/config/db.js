const mongoose = require('mongoose');

const wait = (ms) => new Promise((res) => setTimeout(res, ms));

const connectDB = async (retries = 5, backoff = 3000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log('MongoDB connected');
      return;
    } catch (err) {
      console.error(
        `MongoDB connection error (attempt ${attempt}/${retries}):`,
        err.message,
      );

      if (attempt < retries) {
        const delay = backoff * attempt;
        console.log(`Retrying in ${delay}ms...`);
        await wait(delay);
      } else {
        // All retries exhausted - rethrow so caller can decide how to proceed
        throw err;
      }
    }
  }
};

module.exports = connectDB;