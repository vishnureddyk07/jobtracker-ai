import mongoose from "mongoose";

const matchSchema = new mongoose.Schema(
  {
    score: { type: Number, default: 0 },
    explanation: { type: String, default: "" },
  },
  { _id: false }
);

const jobSchema = new mongoose.Schema(
  {
    externalId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, required: true },
    jobType: { type: String, required: true },
    workMode: { type: String, required: true },
    description: { type: String, required: true },
    applyUrl: { type: String, required: true },
    postedAt: { type: Date },
    skills: [{ type: String }],
    match: { type: matchSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export const Job = mongoose.model("Job", jobSchema);
