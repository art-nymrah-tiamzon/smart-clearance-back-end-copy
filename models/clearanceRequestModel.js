const mongoose = require("mongoose");

const ClearanceRequestSchema = new mongoose.Schema({
  faculty_id: { type: String, required: true },
  department: { type: String, required: true },

  academic_year: { type: String, required: true },
  semester: { type: String, required: true },

  status: {
    type: String,
    enum: ["No Status", "Pending", "Approved", "Rejected"],
    default: "No Status"
  },

  remarks: { type: String, default: "" },
  required_documents: { type: Array, default: [] },

  submitted_on: { type: Date, default: Date.now },
  approved_on: { type: Date, default: null },
});

module.exports = mongoose.model("ClearanceRequest", ClearanceRequestSchema);
