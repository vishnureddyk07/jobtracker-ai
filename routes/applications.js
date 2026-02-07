import { Application } from "../models/Application.js";
import { Job } from "../models/Job.js";

const VALID_STATUSES = ["Applied", "Interview", "Offer", "Rejected"];

// Mock storage for offline mode
const mockApplications = new Map();

export default async function applicationRoutes(fastify) {
  fastify.get("/applications/health", async () => ({ status: "ok" }));

  // Create application entry when user confirms apply
  fastify.post("/applications", async (request, reply) => {
    const {
      email,
      jobId,
      jobTitle,
      company,
      appliedAt,
      appliedEarlier,
    } = request.body || {};

    const userEmail = String(email || "").trim().toLowerCase();

    if (!userEmail || !jobTitle || !company) {
      return reply
        .code(400)
        .send({ message: "email, jobTitle, company are required" });
    }

    const appliedAtDate = appliedEarlier
      ? new Date(appliedAt || Date.now() - 7 * 24 * 60 * 60 * 1000)
      : new Date();

    const timeline = [{ status: "Applied", at: appliedAtDate }];

    // Create app in mock storage
    const appId = "app_" + Date.now() + "_" + Math.random();
    const app = {
      _id: appId,
      userEmail,
      jobId,
      jobTitle,
      company,
      status: "Applied",
      timeline,
      appliedAt: appliedAtDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!mockApplications.has(userEmail)) {
      mockApplications.set(userEmail, []);
    }
    mockApplications.get(userEmail).push(app);

    return reply.send({ message: "Application saved", id: app._id });
  });

  // List all applications for a user
  fastify.get("/applications", async (request, reply) => {
    const email = String(request.query?.email || "").trim().toLowerCase();
    if (!email) {
      return reply.code(400).send({ message: "email is required" });
    }

    const items = (mockApplications.get(email) || []).sort((a, b) => 
      new Date(b.appliedAt) - new Date(a.appliedAt)
    );

    return reply.send({ applications: items });
  });

  // Update application status and append timeline
  fastify.patch("/applications/:id/status", async (request, reply) => {
    const { id } = request.params;
    const { status } = request.body || {};

    if (!VALID_STATUSES.includes(status)) {
      return reply.code(400).send({ message: "Invalid status" });
    }

    // Find and update in mock storage
    for (const apps of mockApplications.values()) {
      const app = apps.find(a => a._id === id);
      if (app) {
        app.status = status;
        app.timeline = app.timeline || [];
        app.timeline.push({ status, at: new Date() });
        app.updatedAt = new Date();
        return reply.send({ message: "Status updated", app });
      }
    }

    return reply.code(404).send({ message: "Application not found" });
  });
}
