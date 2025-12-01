const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const cors = require("cors");

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// ROUTES
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/clearance", require("./routes/clearanceRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/uploads", express.static("uploads"));

// DB
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`SERVER RUNNING ON PORT ${PORT}`));
