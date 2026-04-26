import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const invitationsTable = pgTable("invitations", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("field_agent"),
  status: text("status").notNull().default("pending"),
  invitedById: integer("invited_by_id"),
  invitedByName: text("invited_by_name"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
});

export type Invitation = typeof invitationsTable.$inferSelect;
export type InsertInvitation = typeof invitationsTable.$inferInsert;
