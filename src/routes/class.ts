import express from "express";

const router = express.Router();

router.get("/", async (req, res) => {
    res.status(200).json({
        data: [],
        pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
        },
    });
});

export default router;