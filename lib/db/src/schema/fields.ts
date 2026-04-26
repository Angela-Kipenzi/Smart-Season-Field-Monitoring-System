import {
  pgTable,
  serial,
  text,
  date,
  integer,
  timestamp,
  doublePrecision,
} from "drizzle-orm/pg-core";

export const fieldsTable = pgTable("fields", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cropType: text("crop_type").notNull(),
  location: text("location"),
  areaHectares: doublePrecision("area_hectares"),
  plantingDate: date("planting_date").notNull(),
  expectedHarvestDate: date("expected_harvest_date"),
  stage: text("stage").notNull().default("planted"),
  assignedAgentId: integer("assigned_agent_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type FieldRow = typeof fieldsTable.$inferSelect;
export type InsertField = typeof fieldsTable.$inferInsert;
