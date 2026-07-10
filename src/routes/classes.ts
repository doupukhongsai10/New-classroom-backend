import { and, count, desc, eq, getTableColumns, ilike, or, sql } from 'drizzle-orm';
import express from 'express';
import { db } from '../db/index.js';
import { user } from '../db/schema/auth.js';
import { classes, subjects } from '../db/schema/index.js';
import { departments } from '../db/schema/app.js';

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { name, teacherId, subjectId, capacity, description, status, bannerUrl, bannerCldPubId } = req.body;
        const [createdClass] = await db
            .insert(classes)
            .values({
                ...req.body,
                inviteCode: Math.random().toString(36).substring(2, 9),
                name: name ? String(name) : undefined,
                teacherId: teacherId ? String(teacherId) : undefined,
                subjectId: subjectId ? Number(subjectId) : undefined,
                capacity: capacity ? Number(capacity) : undefined,
                description: description ? String(description) : null,
                status: status ? String(status) : 'active',
                bannerUrl: bannerUrl ? String(bannerUrl) : null,
                bannerCldPubId: bannerCldPubId ? String(bannerCldPubId) : null,
            })
            .returning({ id: classes.id });

        if (!createdClass) throw new Error('Class could not be created');

        res.status(201).json({ data: createdClass });
    } catch (e) {
        console.error(`POST /classes error: ${e}`);
        res.status(500).json({ error: e });
    }
});

router.get('/', async (req, res) => {
    try {
        const { search, subject, teacher, page = '1', limit = '10' } = req.query;

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
                    ilike(classes.name, `%${String(search)}%`),
                    ilike(subjects.name, `%${String(search)}%`),
                    ilike(user.name, `%${String(search)}%`),
                )
            );
        }

        if (subject) {
            filterConditions.push(ilike(subjects.name, `%${String(subject)}%`));
        }

        if (teacher) {
            filterConditions.push(ilike(user.name, `%${String(teacher)}%`));
        }

        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

        const countResult = await db
            .select({ count: sql<number>`count(*)`.mapWith(Number) })
            .from(classes)
            .leftJoin(subjects, eq(classes.subjectId, subjects.id))
            .leftJoin(user, eq(classes.teacherId, user.id))
            .where(whereClause);

        const totalCount = countResult[0]?.count ?? 0;

        const classList = await db
            .select({
                ...getTableColumns(classes),
                subject: {
                    id: subjects.id,
                    name: subjects.name,
                    code: subjects.code,
                },
                teacher: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            })
            .from(classes)
            .leftJoin(subjects, eq(classes.subjectId, subjects.id))
            .leftJoin(user, eq(classes.teacherId, user.id))
            .where(whereClause)
            .orderBy(desc(classes.createdAt))
            .limit(limitPerPage)
            .offset(offset);

        res.status(200).json({
            data: classList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage),
            },
        });
    } catch (e) {
        console.error(`GET /classes error: ${e}`);
        res.status(500).json({ error: 'Failed to get classes' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const classId = Number(req.params.id);

        if (!Number.isFinite(classId)) {
            return res.status(400).json({ error: 'No class found' });
        }

        const [classDetails] = await db
            .select({
                id: classes.id,
                name: classes.name,
                description: classes.description,
                subjectId: classes.subjectId,
                teacherId: classes.teacherId,
                capacity: classes.capacity,
                status: classes.status,
                bannerUrl: classes.bannerUrl,
                bannerCldPubId: classes.bannerCldPubId,
                inviteCode: classes.inviteCode,
                createdAt: classes.createdAt,
                updatedAt: classes.updatedAt,
                subject: {
                    id: subjects.id,
                    name: subjects.name,
                    code: subjects.code,
                    description: subjects.description,
                },
                teacher: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                    role: user.role,
                },
                department: {
                    id: departments.id,
                    name: departments.name,
                    description: departments.description,
                },
            })
            .from(classes)
            .leftJoin(subjects, eq(classes.subjectId, subjects.id))
            .leftJoin(user, eq(classes.teacherId, user.id))
            .leftJoin(departments, eq(subjects.departmentId, departments.id))
            .where(eq(classes.id, classId));

        if (!classDetails) {
            return res.status(404).json({ error: 'No class found' });
        }

        res.status(200).json({ data: classDetails });
    } catch (error) {
        console.error(`GET /classes/:id error:`, error);
        res.status(500).json({ error: 'Failed to get class details' });
    }
});

export default router;