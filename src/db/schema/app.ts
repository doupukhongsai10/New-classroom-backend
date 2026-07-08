import { relations } from "drizzle-orm";
import { integer, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { user } from "./auth.js";

const timestamps = {
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull()
};

export const departments = pgTable('departments', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    code: varchar('code', {length: 50}).notNull().unique(),
    name: varchar('name', {length: 255}).notNull(),
    description: varchar('description', {length: 255}),
    ...timestamps
});

export const subjects = pgTable('subjects', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    departmentId: integer('department_id').notNull().references(() => departments.id, { onDelete: 'restrict'}),
    name: varchar('name', {length: 255}).notNull(),
    code: varchar('code', {length: 50}).notNull().unique(),
    description: varchar('description', {length: 255}),
    ...timestamps
});

export const classStatusEnum = pgEnum('class_status', ['active', 'inactive']);

export const classes = pgTable('classes', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    name: varchar('name', {length: 255}).notNull(),
    description: text('description'),
    subjectId: integer('subject_id').notNull().references(() => subjects.id, { onDelete: 'restrict'}),
    teacherId: text('teacher_id').notNull().references(() => user.id, { onDelete: 'cascade'}),
    capacity: integer('capacity').notNull(),
    status: classStatusEnum('status').notNull().default('active'),
    bannerUrl: text('banner_url'),
    bannerCldPubId: text('banner_cld_pub_id'),
    inviteCode: text('invite_code').unique(),
    ...timestamps
});

export const departmentRelations = relations(departments, ({ many }) => ({ subjects: many(subjects)}));

export const subjectsRelations = relations(subjects, ({ one, many }) => ({ 
    department: one(departments, {
        fields: [subjects.departmentId],
        references: [departments.id],
    }),
    classes: many(classes)
}));

export const classesRelations = relations(classes, ({ one }) => ({
    subject: one(subjects, {
        fields: [classes.subjectId],
        references: [subjects.id]
    }),
    teacher: one(user, {
        fields: [classes.teacherId],
        references: [user.id]
    })
}));

export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;

export type Subject = typeof subjects.$inferSelect;
export type NewSubject = typeof subjects.$inferInsert;

export type Class = typeof classes.$inferSelect;
export type NewClass = typeof classes.$inferInsert;
