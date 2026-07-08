import { and, count, desc, eq, getTableColumns, ilike, or, sql } from 'drizzle-orm';
import express from 'express';
import { departments, subjects } from '../db/schema/index.js';
import { db } from '../db/index.js';

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { name, code, departmentId, description } = req.body ?? {};

        if (!name || !code || !departmentId) {
            return res.status(400).json({ error: "name, code and departmentId are required" });
        }

        const [createdSubject] = await db
            .insert(subjects)
            .values({
                name: String(name),
                code: String(code),
                departmentId: Number(departmentId),
                description: description ? String(description) : null,
            })
            .onConflictDoNothing({ target: subjects.code })
            .returning({ id: subjects.id, name: subjects.name, code: subjects.code });

        if (!createdSubject) {
            return res.status(200).json({ data: null, message: "subject already exists" });
        }

        res.status(201).json({ data: createdSubject });
    } catch (e) {
        console.error("POST /subjects error:", e);
        res.status(500).json({ error: "Failed to create subject" });
    }
});

router.get("/", async (req,res) =>{
    try {
        const { search, department, page = '1', limit = '10' } = req.query;
        console.log(req.query);
        
        const pageValue = Array.isArray(page) ? page[0] : page;
        const limitValue = Array.isArray(limit) ? limit[0] : limit;

        const currentPage = Number(pageValue);      
        const limitPerPage = Math.min(100, Math.max(1, Number(limitValue)));

        if (!Number.isInteger(currentPage) || currentPage < 1 || !Number.isInteger(limitPerPage) || limitPerPage < 1) {
            return res.status(400).json({ error: 'page and limit must be positive integers' });
        }

        const offset = (currentPage-1)*limitPerPage;
        const filterConditions = [];

        if(search) {
            filterConditions.push(
                or(
                    ilike(subjects.name, `%${search}%`),
                    ilike(subjects.code, `%${search}%`),
                )
            );
        }
        if(department){
            const deptPattern = `%${String(department).replace(/[%_]/g, '\\$@')}%`;
            filterConditions.push(ilike(departments.name, deptPattern));
        }
        const whereClause = filterConditions.length > 0? and(...filterConditions): undefined;

        const countResult = await db
            .select({ count: sql<number>`count(*)`.mapWith(Number)})
            .from(subjects)
            .leftJoin(departments, eq(subjects.departmentId, departments.id))
            .where(whereClause);

        const totalCount = countResult[0]?.count ?? 0;

        const subjectList = await db
            .select({ 
                ...getTableColumns(subjects),
                department: { ...getTableColumns(departments)}
            }).from(subjects).leftJoin(departments, eq(subjects.departmentId, departments.id))
            .where(whereClause)
            .orderBy(desc(subjects.createdAt))
            .limit(limitPerPage)
            .offset(offset);

        res.status(200).json({
            data: subjectList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount/limitPerPage),
            }
        })

    }catch(e){
        console.error(`GET /subjects error: ${e}`);
        res.status(500).json({ error: 'Failed to get subjects'});
    }
})
export default router