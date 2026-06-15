import { Response } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { sendSuccess } from "../../lib/helpers.js";
import { AuthRequest } from "../../middlewares/auth.js";

export const getNotifications = async (req: AuthRequest, res: Response) => {
  const notifications = await db.select().from(notificationsTable)
    .where(eq(notificationsTable.userId, req.user!.id))
    .orderBy(desc(notificationsTable.createdAt)).limit(50);
  return sendSuccess(res, notifications, "Notifications récupérées");
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  await db.update(notificationsTable).set({ isRead: true })
    .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, req.user!.id)));
  return sendSuccess(res, null, "Notification marquée comme lue");
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  await db.update(notificationsTable).set({ isRead: true })
    .where(eq(notificationsTable.userId, req.user!.id));
  return sendSuccess(res, null, "Toutes les notifications marquées comme lues");
};
