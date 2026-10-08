import { z } from "zod";

/** Lifecycle of a resident's ticket (zgłoszenie). */
export const ticketStatuses = [
  "new",
  "accepted",
  "in_progress",
  "waiting",
  "done",
  "rejected",
] as const;

export const ticketStatusSchema = z.enum(ticketStatuses);

export type TicketStatus = z.infer<typeof ticketStatusSchema>;
