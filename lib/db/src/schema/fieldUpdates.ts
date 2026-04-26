import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const fieldUpdatesTable = pgTable("field_updates", {
  id: serial("id").primaryKey(),
  fieldId: integer("field_id").notNull(),
  authorId: integer("author_id").notNull(),
  previousStage: text("previous_stage"),
  newStage: text("new_stage"),
  note: text("note").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type FieldUpdateRow = typeof fieldUpdatesTable.$inferSelect;
export type InsertFieldUpdate = typeof fieldUpdatesTable.$inferInsert;
