import { and, count, desc, eq, getTableColumns, ilike, or, sql } from 'drizzle-orm';
import express from 'express';
import { departments, subjects } from '../db/schema/app';
import { db } from '../db';

const router = express.Router();

router.get("/", async (req,res) =>{
    try {
        const { search, department, page = '1', limit = '10' } = req.query;
        const pageValue = Array.isArray(page) ? page[0] : page;
        const limitValue = Array.isArray(limit) ? limit[0] : limit;

        const currentPage = Number(pageValue);      
        const limitPerPage = Math.min(100, Math.max(1, +limit));

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
            filterConditions.push(ilike(departments.name, `%${department}%`));
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