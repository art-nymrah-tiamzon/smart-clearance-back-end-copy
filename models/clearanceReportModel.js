const mongoose = require("mongoose");

const ClearanceReportSchema = new mongoose.Schema(
  {
    faculty_id: { type: String, required: true },

    department: { type: String, required: true }, // 1 doc = 1 department
    status: { type: String, default: "Pending" }, // Pending / Approved / Rejected
    remarks: { type: String, default: "" },

    submitted_on: { type: String, required: true },
    academic_year: { type: String, required: true },
    semester: { type: String, required: true },

    required_documents: { type: [String], default: [] },

    request_id: { type: String, required: true },
    download_url: { type: String, default: "" }
  },
  { timestamps: true }
);

// collection name forced to "clearance_report"
module.exports = mongoose.model("ClearanceReport", ClearanceReportSchema);

