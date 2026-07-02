import { PrismaClient } from "@prisma/client";

// Single shared Prisma client for the process. Reused by the API and the WebSocket layer.
export const prisma = new PrismaClient();

export async function disconnect(): Promise<void> {
  await prisma.$disconnect();
}
