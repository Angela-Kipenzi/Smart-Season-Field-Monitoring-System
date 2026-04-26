import type { Request, Response, NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { eq } from "drizzle-orm";
import {
  db,
  usersTable,
  invitationsTable,
  type User,
} from "@workspace/db";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      currentUser?: User;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const auth = getAuth(req);
  const clerkId = auth?.userId;
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId));

  let user: User | undefined = existing[0];

  if (!user) {
    const clerkUser = await clerkClient.users.getUser(clerkId);
    const email = (
      clerkUser.primaryEmailAddress?.emailAddress ??
      clerkUser.emailAddresses[0]?.emailAddress ??
      `${clerkId}@example.com`
    ).toLowerCase();
    const name =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      clerkUser.username ||
      email.split("@")[0] ||
      "Unnamed";

    const [invitation] = await db
      .select()
      .from(invitationsTable)
      .where(eq(invitationsTable.email, email));

    let role: string | null = null;

    if (invitation && invitation.status === "pending") {
      role = invitation.role;
      await db
        .update(invitationsTable)
        .set({ status: "accepted", acceptedAt: new Date() })
        .where(eq(invitationsTable.id, invitation.id));
    } else {
      const totalRows = await db.select().from(usersTable);
      if (totalRows.length === 0) {
        role = "admin";
      }
    }

    if (role === null) {
      res.status(403).json({
        error: "no_invitation",
        message:
          "Your account hasn't been invited to SmartSeason yet. Ask your coordinator to send you an invitation.",
      });
      return;
    }

    const [created] = await db
      .insert(usersTable)
      .values({ clerkId, email, name, role })
      .returning();
    user = created;
  }

  if (!user) {
    res.status(500).json({ error: "Failed to load user" });
    return;
  }

  req.currentUser = user;
  next();
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.currentUser?.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}
