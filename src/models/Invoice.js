import mongoose from "mongoose";

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["draft", "sent", "paid", "overdue"],
    default: "draft",
  },
  dueDate: { type: Date, required: true },
  issuedDate: { type: Date, default: Date.now },
  items: [
    {
      description: String,
      quantity: Number,
      rate: Number,
      amount: Number,
    },
  ],
  notes: String,
  paidAt: Date,
  createdAt: { type: Date, default: Date.now },
});

const Invoice = mongoose.models.Invoice || mongoose.model("Invoice", InvoiceSchema);

export default Invoice;