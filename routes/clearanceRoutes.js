const express = require("express");
const router = express.Router();
const ClearanceReport = require("../models/clearanceReportModel");

// GET clearance report by faculty ID
router.get("/report/:facultyId", async (req, res) => {
  try {
    const facultyId = req.params.facultyId;

    const reports = await ClearanceReport.find({ faculty_id: facultyId });

    if (!reports) {
      return res.status(404).json({ message: "No clearance reports found" });
    }

    res.status(200).json(reports);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
