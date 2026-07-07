import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import subjectsRouter from "./routes/subject.js";
import classesRouter from "./routes/class.js";
import securityMiddleware from "./middleware/security.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 8000;

if (!process.env.FRONTEND_URL) {
    throw new Error("FRONTEND_URL is not set in .env file");
}

console.log("FRONTEND_URL =", process.env.FRONTEND_URL);

// CORS FIRST — supports comma-separated list of allowed origins
const allowedOrigins = (process.env.FRONTEND_URL ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. curl, Postman, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
}));

// Then body parser
app.use(express.json());

app.use(securityMiddleware);

// Then routes
app.use("/api/subjects", subjectsRouter);
app.use("/api/classes", classesRouter);

app.get("/", (req, res) => {
    res.send("Hello!, Welcome to classroom API");
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});