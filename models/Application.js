import mongoose from "mongoose";

const timelineSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["Applied", "Interview", "Offer", "Rejected"],
      required: true,
    },
    at: { type: Date, required: true },
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    userEmail: { type: String, required: true, index: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
    jobTitle: { type: String, required: true },
    company: { type: String, required: true },
    status: {
      type: String,
      enum: ["Applied", "Interview", "Offer", "Rejected"],
      default: "Applied",
    },
    timeline: { type: [timelineSchema], default: [] },
    appliedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export const Application = mongoose.model("Application", applicationSchema);
