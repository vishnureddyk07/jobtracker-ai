import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { Resume } from "../models/Resume.js";
import { getResumeFromStore, setResumeInStore } from "../config/resumeStore.js";

const MAX_TEXT_LENGTH = 200_000;

const extractTextFromFile = async (fileBuffer, contentType, filename) => {
  const lowerFilename = filename?.toLowerCase() || "";
  const isPdf =
    contentType === "application/pdf" || lowerFilename.endsWith(".pdf");
  const isTxt =
    contentType === "text/plain" || lowerFilename.endsWith(".txt");
  const isDocx = 
    contentType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
    lowerFilename.endsWith(".docx");
  const isDoc =
    contentType === "application/msword" ||
    lowerFilename.endsWith(".doc");

  if (isPdf) {
    const parsed = await pdfParse(fileBuffer);
    return parsed.text || "";
  }

  if (isTxt) {
    return fileBuffer.toString("utf-8");
  }

  if (isDocx || isDoc) {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    return result.value || "";
  }

  throw new Error("Unsupported file type. Upload PDF, TXT, DOC, or DOCX only.");
};

// Mock storage for offline mode (shared)

export default async function resumeRoutes(fastify) {
  fastify.get("/resume/health", async () => ({ status: "ok" }));

  // Upload or replace resume (single resume per user)
  fastify.post("/resume", async (request, reply) => {
    try {
      console.log("📤 Resume upload started");
      const parts = request.parts();

      let email = "";
      let fileBuffer = null;
      let filename = "";
      let mimetype = "";

      for await (const part of parts) {
        if (part.type === "field" && part.fieldname === "email") {
          email = String(part.value || "").trim().toLowerCase();
          console.log("📧 Email:", email);
        }

        if (part.type === "file" && part.fieldname === "resume") {
          console.log("📄 File:", part.filename, part.mimetype);
          filename = part.filename;
          mimetype = part.mimetype;
          fileBuffer = await part.toBuffer();
          console.log("✅ Buffer size:", fileBuffer.length);
        }
      }

      if (!email) {
        return reply.code(400).send({ message: "Email is required" });
      }

      if (!fileBuffer) {
        return reply.code(400).send({ message: "Resume file is required" });
      }

      // Extract text using the correct parser
      let text = "";
      try {
        console.log("🔍 Extracting text from file...");
        text = await extractTextFromFile(
          fileBuffer,
          mimetype,
          filename
        );
        console.log("✅ Text extracted, length:", text.length);
      } catch (error) {
        console.error("❌ Extraction error:", error.message);
        return reply.code(400).send({ message: error.message });
      }

      if (!text || text.trim().length === 0) {
        return reply
          .code(400)
          .send({ message: "Could not extract any text from resume" });
      }

      // Limit stored text size
      if (text.length > MAX_TEXT_LENGTH) {
        text = text.slice(0, MAX_TEXT_LENGTH);
      }

      console.log("💾 Saving resume...");

      let savedResume = null;
      try {
        savedResume = await Resume.findOneAndUpdate(
          { userEmail: email },
          {
            userEmail: email,
            originalName: filename,
            contentType: mimetype,
            text,
          },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );
      } catch (dbError) {
        console.log("⚠️ DB save failed, using mock storage:", dbError.message);
      }

      if (!savedResume) {
        const resumeId = "resume_" + Date.now();
        setResumeInStore(email, {
          _id: resumeId,
          userEmail: email,
          originalName: filename,
          contentType: mimetype,
          text,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        savedResume = getResumeFromStore(email);
      }

      console.log("✅ Resume saved successfully");
      return reply.send({
        message: "Resume uploaded",
        resumeId: savedResume._id,
      });
    } catch (error) {
      console.error("❌ Upload error:", error);
      return reply.code(500).send({ message: "Upload failed: " + error.message });
    }
  });

  // Get latest resume metadata (used by frontend to check status)
  fastify.get("/resume/:email", async (request, reply) => {
    const email = String(request.params.email || "")
      .trim()
      .toLowerCase();

    if (!email) {
      return reply.code(400).send({ message: "Email is required" });
    }

    let resume = null;

    try {
      resume = await Resume.findOne({ userEmail: email }).lean().exec();
    } catch (dbError) {
      console.log("⚠️ DB read failed, checking mock storage:", dbError.message);
    }

    if (!resume) {
      resume = getResumeFromStore(email);
    }

    if (!resume) {
      return reply.send({ 
        ok: false, 
        message: "No resume found",
        originalName: null,
        updatedAt: null 
      });
    }

    return reply.send({
      ok: true,
      id: resume._id,
      originalName: resume.originalName,
      updatedAt: resume.updatedAt,
      uploadedAt: resume.createdAt,
    });
  });
}
