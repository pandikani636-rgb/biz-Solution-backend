import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isTicketCancellationAllowed, TICKET_CANCELLATION_WINDOW_MS } from '../src/services/ticketBookingPolicy.js';

describe('Ticket cancellation window', () => {
  const now = new Date('2026-11-11T00:00:00.000Z');

  it('allows cancellation exactly 48 hours before departure', () => {
    const departure = new Date(now.getTime() + TICKET_CANCELLATION_WINDOW_MS);
    assert.equal(isTicketCancellationAllowed(departure, now), true);
  });

  it('allows cancellation more than 48 hours before departure', () => {
    const departure = new Date(now.getTime() + TICKET_CANCELLATION_WINDOW_MS + 1);
    assert.equal(isTicketCancellationAllowed(departure, now), true);
  });

  it('rejects cancellation less than 48 hours before departure', () => {
    const departure = new Date(now.getTime() + TICKET_CANCELLATION_WINDOW_MS - 1);
    assert.equal(isTicketCancellationAllowed(departure, now), false);
  });
});
