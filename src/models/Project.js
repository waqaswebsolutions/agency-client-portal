import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  status: {
    type: String,
    enum: ["planning", "in-progress", "review", "completed"],
    default: "planning",
  },
  progress: { type: Number, default: 0 },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  budget: Number,
  deadline: Date,
  startDate: Date,
  tasks: [
    {
      title: String,
      completed: { type: Boolean, default: false },
      dueDate: Date,
    },
  ],
  files: [
    {
      name: String,
      url: String,
      uploadedAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Project = mongoose.models.Project || mongoose.model("Project", ProjectSchema);

export default Project;