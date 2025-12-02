const express = require("express");
const router = express.Router();
const ClearanceRequest = require("../models/clearanceRequestModel");


// ============= 1) FACULTY SEND REQUEST =============
router.post("/request/send", async (req, res) => {
  try {
    const { faculty_id, department, academic_year, semester } = req.body;

    if (!faculty_id || !department || !academic_year || !semester)
      return res.status(400).json({ success:false, message:"Missing fields" });

    const exists = await ClearanceRequest.findOne({ faculty_id, department, academic_year, semester });

    if (exists && exists.status === "Approved")
      return res.status(403).json({ success:false, message:"Already approved" });

    if (exists) {
      exists.status = "No Status";
      exists.submitted_on = new Date();
      exists.approved_on = null;
      await exists.save();
      return res.status(200).json({ success:true, message:"Request reset", request:exists });
    }
    
      const newReq = await ClearanceRequest.create({
        faculty_id,
        department,
        academic_year,
        semester,
        status: "No Status",
        submitted_on: new Date(),   // ✅ REAL CURRENT DATE
        approved_on: null
      });


    res.status(201).json({ success:true, request:newReq });

  } catch (err) {
    res.status(500).json({ success:false, message:err.message });
  }
});


// ============= 2) FACULTY VIEW ALL REQUESTS =============
router.get("/request/:facultyId", async (req,res)=>{
  try{
    const list = await ClearanceRequest.find({ faculty_id:req.params.facultyId });
    res.json({ success:true, data:list });
  } catch(e){ res.json({ success:false, message:e });}
});


// ============= 3) VIEW REQUEST BY ID =============
router.get("/request/by-id/:id", async (req, res) => {
  try {
    const request = await ClearanceRequest.findById(req.params.id);
    if (!request) return res.json({ success:false,message:"Request not found" });
    return res.json({ success:true, data: request });
  } catch (err) {
    return res.json({ success:false, message: err.toString() });
  }
});


// ============= 4) VIEW REQUESTS BY DEPARTMENT =============
router.get("/requests/department/:dept", async (req,res)=>{
  try{
    const list = await ClearanceRequest.find({ department:req.params.dept }).sort({submitted_on:-1});
    res.json({ success:true, data:list });
  } catch(e){ res.json({ success:false, message:e }); }
});


// ============= 5) UPDATE STATUS (Approve/Pend/Reject) =============
router.patch("/request/:id", async (req,res)=>{
  try{
    const { status, remarks, required_documents } = req.body;
    if(!status) return res.json({ success:false, message:"Status required" });

    const update = { status };
    if(status=="Approved") update.approved_on=new Date();
    if(remarks) update.remarks=remarks;
    if(required_documents) update.required_documents=required_documents;

    const updated = await ClearanceRequest.findByIdAndUpdate(req.params.id,update,{new:true});
    res.json({ success:true, data:updated });

  } catch(e){ res.json({ success:false, message:e }); }
});


// ============= 6) FACULTY RESUBMIT REQUEST =============
router.patch("/request/resubmit/:id", async (req,res) => {
  try {
    const updated = await ClearanceRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: "Pending",
        submitted_on: new Date(),
        approved_on: null
      },
      { new: true }
    );

    if (!updated) return res.json({ success:false, message:"Request Not Found" });

    return res.json({ success:true, message:"Request Resubmitted", data:updated });
  }
  catch(e){ 
    return res.json({ success:false, message:e.message }); 
  }
});

// =====================================================
// 🔥 FILE UPLOAD 
// =====================================================
const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now()+"-"+file.originalname)
});

const upload = multer({ storage });
router.put("/upload/:id", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.json({ success:false, message:"No file uploaded" });

    const request = await ClearanceRequest.findById(req.params.id);
    if (!request) return res.json({ success:false, message:"Request not found" });

    const rawName = req.body.name;
    const index = request.required_documents.findIndex(
      d => d.name.trim().toLowerCase() === rawName.trim().toLowerCase()
    );

    if (index !== -1) {
      request.required_documents[index].file = req.file.filename;
      request.required_documents[index].status = "Submitted";

    } else {
      request.required_documents.push({
        name: rawName.trim(),
        file: req.file.filename,
        status: "Submitted"
      });
    }

    await request.markModified("required_documents");
    await request.save();

    return res.json({ success:true, message:"File saved + kept in DB", data: request });

  } catch (e) {
    return res.json({ success:false, message:e.toString() });
  }
});

// =====================================================
// 7) ADMIN ADD REQUIRED DOCUMENT
// =====================================================
router.post("/add-doc/:id", async (req,res)=>{
  try{
    const { name } = req.body;
    if(!name) return res.json({success:false,message:"Document name required"});

    const request = await ClearanceRequest.findById(req.params.id);
    if(!request) return res.json({success:false,message:"Request not found"});

    const exists = request.required_documents.some(
      d => d.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
    if(exists) return res.json({success:false,message:"Document already exists"});

    request.required_documents.push({
      name:name.trim(),
      file:"",
      status:"Pending"
    });

    await request.save();

    return res.json({ success:true, message:"Required doc added", data:request });

  } catch(e){
    res.json({success:false,message:e.toString()});
  }
});

// =====================================================
// 8) UPDATE STATUS FOR A SINGLE DOCUMENT (APPROVE/REJECT)
// =====================================================
router.patch("/document-status/:id", async (req,res)=> {
  try {
    const { docName, status } = req.body;

    if (!docName || !status)
      return res.json({ success:false, message:"docName + status required" });

    const request = await ClearanceRequest.findById(req.params.id);
    if (!request) return res.json({ success:false, message:"Request not found" });

    const index = request.required_documents.findIndex(
      d => d.name.trim().toLowerCase() === docName.trim().toLowerCase()
    );

    if (index === -1)
      return res.json({ success:false, message:"Document not found" });

    // 🔥 Update individual document
    request.required_documents[index].status = status;
    request.required_documents[index].reviewed_on = new Date();

    await request.markModified("required_documents");
    await request.save();

    return res.json({ success:true, message:"Document updated", data:request });

  } catch(e) {
    return res.json({ success:false, message:e.toString() });
  }
});

// =====================================================
// 9) 🔥 UPDATE GLOBAL REMARKS (Admin Feedback)
// =====================================================
router.patch("/remarks/:id", async (req,res) => {
  try {
    const { remarks } = req.body;

    const updated = await ClearanceRequest.findByIdAndUpdate(
      req.params.id,
      { remarks },
      { new: true }
    );

    if (!updated) return res.json({ success:false, message:"Request not found" });

    return res.json({ success:true, message:"Remarks updated ✔", data:updated });

  } catch (e) {
    return res.json({ success:false, message:e.toString() });
  }
});

module.exports = router;
