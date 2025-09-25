const express = require("express");
const cors = require("cors");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

let { FormData } = require("formdata-node"); // Try modern formdata-node
if (!FormData) {
  console.warn("formdata-node not found, falling back to form-data (deprecated). Please install formdata-node with 'npm install formdata-node'");
  ({ FormData } = require("form-data")); // Fallback to deprecated form-data
}

const mongoose = require("mongoose");
const multer = require("multer");

const app = express();
const AUTH_API = "https://authentication-8e1c.onrender.com/auth";

// ====== MongoDB Setup ======
const MONGO_URI =
  "mongodb+srv://sasinew49_db_user:TcFkmDIaiccTDO3W@cluster-resumeproject.6dhm1e9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster-ResumeProject";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ Attempting MongoDB connection...");
    console.log("✅ MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection attempt failed:", err);
    console.error("Error details:", {
      message: err.message,
      code: err.code,
      codeName: err.codeName,
      errorResponse: err.errorResponse
    });
  });

// ====== Schema & Model ======
const ResumeSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  file: { data: Buffer, contentType: String },
  originalFileName: { type: String },
  uploadedAt: { type: Date, default: Date.now },
});

// Force collection = "resumes"
const Resume = mongoose.model("Resume", ResumeSchema, "resumes");

// ====== Middlewares ======
app.use(cors({ origin: "http://127.0.0.1:5500" }));
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// ====== Auth Proxy ======
app.post("/auth", async (req, res) => {
  console.log('Received auth request:', req.body);
  try {
    const formData = new FormData();
    formData.append("email", req.body.email);
    formData.append("password", req.body.password);
    formData.append("action", req.body.action);

    console.log('Sending auth request to external API');
    const response = await fetch(AUTH_API, { method: "POST", body: formData });
    const data = await response.json();
    console.log('Auth response from external API:', data);
    res.status(response.status).json(data);
  } catch (err) {
    console.error("❌ Auth error:", err);
    res.status(500).json({ message: "Auth service unavailable", error: err.message });
  }
});

// ====== Resume Upload ======
app.post("/resume/upload", upload.single("resume"), async (req, res) => {
  console.log('Received resume upload request with email:', req.body.email);
  try {
    const { email } = req.body;
    if (!email || !req.file) {
      console.log('Validation failed: Email or file missing');
      return res.status(400).json({ error: "Email and resume required" });
    }

    console.log('Updating or creating resume in MongoDB');
    const resume = await Resume.findOneAndUpdate(
      { email },
      {
        file: { data: req.file.buffer, contentType: req.file.mimetype },
        originalFileName: req.file.originalname,
        uploadedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    console.log('Resume saved successfully:', resume);
    res.json({ message: "✅ Resume uploaded successfully", resume });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ error: "Failed to upload resume", details: err.message });
  }
});

// ====== Fetch Jobs ======
app.post("/fetchJobs", upload.single("resume"), async (req, res) => {
  console.log('Received fetch jobs request with email:', req.body.email);
  try {
    let resumeBuffer;
    let filename = "resume.pdf"; // Fixed filename as per requirement

    if (req.file) {
      console.log('Using uploaded file:', req.file.originalname);
      resumeBuffer = req.file.buffer;
    } else if (req.body.email) {
      console.log('Fetching resume from MongoDB for email:', req.body.email);
      const resume = await Resume.findOne({ email: req.body.email });
      if (!resume) {
        console.log('Resume not found for email:', req.body.email);
        return res.status(404).json({ error: "Resume not found" });
      }
      resumeBuffer = resume.file.data;
    } else {
      console.log('No resume or email provided');
      return res.status(400).json({ error: "Resume or email required" });
    }

    console.log('Validating resume buffer, size:', resumeBuffer.length);
    if (!resumeBuffer || resumeBuffer.length === 0) {
      console.log('Resume buffer is empty or invalid');
      return res.status(400).json({ error: "Resume file is empty or invalid" });
    }

    const formData = new FormData();
    // Convert Buffer to Blob for formdata-node compatibility
    const blob = new Blob([resumeBuffer], { type: 'application/pdf' });
    console.log('Converting Buffer to Blob, filename:', filename);
    formData.append("file", blob, { filename: filename, contentType: "application/pdf" }); // Key 'file' with filename 'resume.pdf'

    // Log FormData contents (approximate, as FormData can't be logged directly)
    console.log('FormData prepared with key "file", filename:', filename, 'contentType:', 'application/pdf');

    console.log('Sending request to external API, URL:', 'https://eday-project.onrender.com/api/v1/alerts/upload?top_k=3');
    const response = await fetch(
      "https://eday-project.onrender.com/api/v1/alerts/upload?top_k=3",
      {
        method: "POST",
        body: formData,
        headers: {
          "Accept": "application/json"
        }
      }
    );

    const responseBody = await response.text();
    console.log('API Response Status:', response.status);
    console.log('API Response Body:', responseBody);

    if (!response.ok) {
      console.log('API request failed');
      throw new Error(`API request failed with status ${response.status}: ${responseBody}`);
    }

    const data = JSON.parse(responseBody);
    console.log('Parsed API response:', data);
    res.json(data);
  } catch (err) {
    console.error("❌ FetchJobs error:", err);
    res.status(500).json({ error: "Failed to fetch jobs", details: err.message });
  }
});

// ====== Start Server ======
const PORT = 4000;
app.listen(PORT, () =>
  console.log(`✅ Server running at http://localhost:${PORT}`)
);