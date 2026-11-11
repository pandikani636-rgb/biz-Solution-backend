export const TICKET_CANCELLATION_WINDOW_MS = 48 * 60 * 60 * 1000;

export const isTicketCancellationAllowed = (travelAt, now = new Date()) =>
  new Date(travelAt).getTime() - now.getTime() >= TICKET_CANCELLATION_WINDOW_MS;
