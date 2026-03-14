import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true }, // Enforce unique email
  name: { type: String, required: true },
  role: { type: String, enum: ["admin", "client"], default: "client" },
  avatar: String,
  company: String,
  phone: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Check if model exists before creating new one
const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;