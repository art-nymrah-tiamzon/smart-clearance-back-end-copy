const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();

const app = express();
app.use(express.json());

// ROUTES
const authRoutes = require("./routes/authRoutes");
const clearanceRoutes = require("./routes/clearanceRoutes");
const reportRoutes = require("./routes/reportRoutes");

// USE ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/clearance", clearanceRoutes);
app.use("/api/reports", reportRoutes);

// CONNECT DB
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
