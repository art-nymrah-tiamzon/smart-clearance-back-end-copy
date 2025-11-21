const express = require("express");
const router = express.Router();
const ClearanceReport = require("../models/clearanceReportModel");

router.get("/:facultyId", async (req, res) => {
  try {
    const data = await ClearanceReport.findOne({
      faculty_id: req.params.facultyId
    });

    if (!data) {
      return res.status(404).json({ message: "No report found" });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
