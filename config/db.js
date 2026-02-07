import mongoose from "mongoose";

export const connectDB = async (fastify) => {
  const mongoUri = process.env.MONGODB_URI;
  
  if (!mongoUri) {
    fastify.log.warn("MONGODB_URI not set - running in offline/mock mode");
    return;
  }

  try {
    await mongoose.connect(mongoUri, {
      dbName: process.env.MONGODB_DB || "jobtracker",
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
    });
    fastify.log.info("MongoDB connected successfully");
  } catch (error) {
    fastify.log.warn("MongoDB connection failed - running in offline/mock mode");
    fastify.log.warn(error.message);
    // Don't exit - allow app to run in mock mode
  }
};
