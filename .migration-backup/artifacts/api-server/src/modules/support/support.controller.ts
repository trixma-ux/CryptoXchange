import { Response } from "express";
import { db } from "@workspace/db";
import { supportTicketsTable, supportMessagesTable, usersTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { sendSuccess, sendError } from "../../lib/helpers.js";
import { AuthRequest } from "../../middlewares/auth.js";

export const createTicket = async (req: AuthRequest, res: Response) => {
  const { subject, category, priority, message } = req.body;
  if (!subject || !message) return sendError(res, "Sujet et message requis", 400);

  const [ticket] = await db.insert(supportTicketsTable).values({
    userId: req.user!.id, subject, category: category || "Autre",
    priority: priority || "MEDIUM", message, status: "OPEN",
  }).returning();

  await db.insert(supportMessagesTable).values({
    ticketId: ticket.id, userId: req.user!.id, message, isStaff: false,
  });

  return sendSuccess(res, ticket, "Ticket de support créé", 201);
};

export const getTickets = async (req: AuthRequest, res: Response) => {
  const tickets = await db.select().from(supportTicketsTable)
    .where(eq(supportTicketsTable.userId, req.user!.id))
    .orderBy(desc(supportTicketsTable.updatedAt));
  return sendSuccess(res, tickets, "Tickets récupérés");
};

export const getTicket = async (req: AuthRequest, res: Response) => {
  const tickets = await db.select().from(supportTicketsTable)
    .where(and(eq(supportTicketsTable.id, req.params.id), eq(supportTicketsTable.userId, req.user!.id))).limit(1);
  if (tickets.length === 0) return sendError(res, "Ticket introuvable", 404);

  const messages = await db.select({
    id: supportMessagesTable.id, message: supportMessagesTable.message,
    isStaff: supportMessagesTable.isStaff, createdAt: supportMessagesTable.createdAt,
    userId: supportMessagesTable.userId,
  }).from(supportMessagesTable)
    .where(eq(supportMessagesTable.ticketId, req.params.id))
    .orderBy(supportMessagesTable.createdAt);

  return sendSuccess(res, { ticket: tickets[0], messages }, "Ticket récupéré");
};

export const replyToTicket = async (req: AuthRequest, res: Response) => {
  const { message } = req.body;
  if (!message) return sendError(res, "Message requis", 400);

  const tickets = await db.select().from(supportTicketsTable)
    .where(and(eq(supportTicketsTable.id, req.params.id), eq(supportTicketsTable.userId, req.user!.id))).limit(1);
  if (tickets.length === 0) return sendError(res, "Ticket introuvable", 404);

  const [msg] = await db.insert(supportMessagesTable).values({
    ticketId: req.params.id, userId: req.user!.id, message, isStaff: false,
  }).returning();

  await db.update(supportTicketsTable).set({ status: "PENDING", updatedAt: new Date() })
    .where(eq(supportTicketsTable.id, req.params.id));

  return sendSuccess(res, msg, "Réponse envoyée");
};

export const closeTicket = async (req: AuthRequest, res: Response) => {
  const tickets = await db.select().from(supportTicketsTable)
    .where(and(eq(supportTicketsTable.id, req.params.id), eq(supportTicketsTable.userId, req.user!.id))).limit(1);
  if (tickets.length === 0) return sendError(res, "Ticket introuvable", 404);

  await db.update(supportTicketsTable).set({ status: "CLOSED", updatedAt: new Date() })
    .where(eq(supportTicketsTable.id, req.params.id));

  return sendSuccess(res, null, "Ticket fermé");
};
