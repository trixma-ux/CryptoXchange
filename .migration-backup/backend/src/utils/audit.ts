import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

export const createAuditLog = async ({
  userId,
  action,
  entity,
  entityId,
  ipAddress,
  userAgent,
  metadata,
}: {
  userId?: string;
  action: string;
  entity?: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: object;
}) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        ipAddress,
        userAgent,
        metadata: metadata as any,
      },
    });
  } catch (error) {
    logger.error('Failed to create audit log:', error);
  }
};
