import mongoose from "mongoose";

const SettingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    companyName: { type: String, default: "" },
    invoicePrefix: { type: String, default: "INV" },
    emailNotifications: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Check if model exists before creating new one
const Setting = mongoose.models.Setting || mongoose.model("Setting", SettingSchema);

export default Setting;