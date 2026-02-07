import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import dotenv from "dotenv";

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import resumeRoutes from "./routes/resume.js";
import jobsRoutes from "./routes/jobs.js";
import applicationRoutes from "./routes/applications.js";
import aiRoutes from "./routes/ai.js";

dotenv.config();

const start = async () => {
  const fastify = Fastify({
    logger: true,
  });

  await fastify.register(cors, {
    origin: true,
  });

  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  });

  fastify.get("/health", async () => {
    return { status: "ok" };
  });

  await fastify.register(authRoutes);
  await fastify.register(resumeRoutes);
  await fastify.register(jobsRoutes);
  await fastify.register(applicationRoutes);
  await fastify.register(aiRoutes);

  await connectDB(fastify);

  const PORT = process.env.PORT || 5000;

  try {
    await fastify.listen({ port: Number(PORT), host: "0.0.0.0" });
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
};

start();
