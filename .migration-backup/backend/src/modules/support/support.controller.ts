import { Response } from 'express';
import { prisma } from '../../utils/prisma';
import { sendSuccess, sendError } from '../../utils/helpers';
import { AuthRequest } from '../../middleware/auth';

// ---- Create Ticket ----
export const createTicket = async (req: AuthRequest, res: Response) => {
  const { subject, category, message } = req.body;
  const ticket = await prisma.supportTicket.create({
    data: {
      userId: req.user!.id, subject, category,
      messages: { create: { userId: req.user!.id, message, isAdmin: false } },
    },
    include: { messages: true },
  });
  return sendSuccess(res, ticket, 'Ticket créé', 201);
};

// ---- Get My Tickets ----
export const getMyTickets = async (req: AuthRequest, res: Response) => {
  const tickets = await prisma.supportTicket.findMany({
    where: { userId: req.user!.id },
    orderBy: { updatedAt: 'desc' },
    include: { messages: { orderBy: { createdAt: 'asc' }, take: 1 } },
  });
  return sendSuccess(res, tickets, 'Tickets récupérés');
};

// ---- Get Ticket ----
export const getTicket = async (req: AuthRequest, res: Response) => {
  const ticket = await prisma.supportTicket.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  if (!ticket) return sendError(res, 'Ticket introuvable', 404);
  return sendSuccess(res, ticket, 'Ticket récupéré');
};

// ---- Reply to Ticket ----
export const replyToTicket = async (req: AuthRequest, res: Response) => {
  const { message } = req.body;
  const ticket = await prisma.supportTicket.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
  if (!ticket) return sendError(res, 'Ticket introuvable', 404);
  if (ticket.status === 'CLOSED') return sendError(res, 'Ce ticket est fermé', 400);

  const msg = await prisma.supportMessage.create({
    data: { ticketId: ticket.id, userId: req.user!.id, message, isAdmin: false },
  });
  await prisma.supportTicket.update({ where: { id: ticket.id }, data: { status: 'IN_PROGRESS', updatedAt: new Date() } });

  return sendSuccess(res, msg, 'Message envoyé', 201);
};
