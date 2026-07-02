import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import subjectsRouter from "./routes/subject";
import classesRouter from "./routes/class";

dotenv.config();

const app = express();
const PORT = 8000;

if (!process.env.FRONTEND_URL) {
    throw new Error("FRONTEND_URL is not set in .env file");
}

console.log("FRONTEND_URL =", process.env.FRONTEND_URL);

// CORS FIRST
app.use(cors({
    origin: "http://localhost:5174",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
}));

// Then body parser
app.use(express.json());

// Then routes
app.use("/api/subjects", subjectsRouter);
app.use("/api/classes", classesRouter);

app.get("/", (req, res) => {
    res.send("Hello!, Welcome to classroom API");
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});