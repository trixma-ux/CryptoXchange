import { Response } from 'express';
import { prisma } from '../../utils/prisma';
import { sendSuccess, sendError } from '../../utils/helpers';
import { AuthRequest } from '../../middleware/auth';
import { io } from '../../index';

// ---- Get Notifications ----
export const getNotifications = async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '20', unreadOnly } = req.query as Record<string, string>;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where: any = { userId: req.user!.id };
  if (unreadOnly === 'true') where.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({ where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' } }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: req.user!.id, isRead: false } }),
  ]);

  return sendSuccess(res, { notifications, total, unreadCount, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) }, 'Notifications récupérées');
};

// ---- Mark as Read ----
export const markAsRead = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (id === 'all') {
    await prisma.notification.updateMany({ where: { userId: req.user!.id }, data: { isRead: true } });
    return sendSuccess(res, null, 'Toutes les notifications marquées comme lues');
  }

  const notification = await prisma.notification.findFirst({ where: { id, userId: req.user!.id } });
  if (!notification) return sendError(res, 'Notification introuvable', 404);

  await prisma.notification.update({ where: { id }, data: { isRead: true } });
  return sendSuccess(res, null, 'Notification marquée comme lue');
};

// ---- Helper: Send Notification ----
export const sendNotification = async ({
  userId, type, title, message, metadata,
}: { userId: string; type: any; title: string; message: string; metadata?: object }) => {
  const notification = await prisma.notification.create({
    data: { userId, type, title, message, metadata: metadata as any },
  });
  // Push via Socket.IO
  io.to(`user_${userId}`).emit('notification', notification);
  return notification;
};
