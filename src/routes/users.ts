import { and, asc, eq, ilike, or, sql } from 'drizzle-orm';
import express from 'express';
import { user } from '../db/schema/auth.js';
import { db } from '../db/index.js';

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { id, name, email, role = "student" } = req.body ?? {};

        if (!id || !email) {
            return res.status(400).json({ error: "id and email are required" });
        }

        const validRoles = ['student', 'teacher', 'admin'] as const;
        const roleValue = String(role) as typeof validRoles[number];

        if (!validRoles.includes(roleValue)) {
            return res.status(400).json({ error: "invalid role" });
        }

        const result = await db.execute(sql`
            insert into "user" ("id", "name", "email", "email_verified", "role")
            values (${String(id)}, ${name ? String(name) : null}, ${String(email)}, true, ${roleValue})
            on conflict ("id") do nothing
            returning "id", "name", "email", "role"
        `);

        const createdUser = (result as { rows?: Array<{ id: string; name: string | null; email: string; role: string }> }).rows?.[0];

        if (!createdUser) {
            return res.status(200).json({ data: null, message: "user already exists" });
        }

        res.status(201).json({ data: createdUser });
    } catch (e) {
        console.error('POST /users error:', e);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

router.get("/", async (req, res) => {
    try {
        const { search, role, page = '1', limit = '10' } = req.query;
        console.log(req.query);

        const pageValue = Array.isArray(page) ? page[0] : page;
        const limitValue = Array.isArray(limit) ? limit[0] : limit;

        const currentPage = Number(pageValue);
        const limitPerPage = Math.min(100, Math.max(1, Number(limitValue)));

        if (!Number.isInteger(currentPage) || currentPage < 1 || !Number.isInteger(limitPerPage) || limitPerPage < 1) {
            return res.status(400).json({ error: 'page and limit must be positive integers' });
        }

        const offset = (currentPage - 1) * limitPerPage;
        const filterConditions = [];

        if (search) {
            filterConditions.push(
                or(
                    ilike(user.name, `%${search}%`),
                    ilike(user.email, `%${search}%`),
                )
            );
        }

        if (role) {
            const validRoles = ['student', 'teacher', 'admin'] as const;
            const roleValue = String(role) as typeof validRoles[number];
            if (validRoles.includes(roleValue)) {
                filterConditions.push(eq(user.role, roleValue));
            }
        }

        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

        const countResult = await db
            .select({ count: sql<number>`count(*)`.mapWith(Number) })
            .from(user)
            .where(whereClause);

        const totalCount = countResult[0]?.count ?? 0;

        const userList = await db
            .select({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            })
            .from(user)
            .where(whereClause)
            .orderBy(asc(user.name))
            .limit(limitPerPage)
            .offset(offset);

        res.status(200).json({
            data: userList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage),
            }
        });

    } catch (e) {
        console.error('GET /users error:', e);
        res.status(500).json({ error: 'Failed to get users' });
    }
});

export default router;
