import request from 'supertest';
import app from '../app';

jest.mock('../db', () => ({
  db: {
    connect: jest.fn().mockResolvedValue(undefined),
    ping: jest.fn().mockResolvedValue(true),
    query: jest.fn().mockResolvedValue([]),
    transaction: jest.fn(),
  },
}));

jest.mock('../contracts/stellar', () => ({
  StellarService: {
    ping: jest.fn().mockResolvedValue(true),
    getAccountBalance: jest.fn(),
  },
}));

describe('JSON request body size limit', () => {
  it('rejects a JSON body larger than 10kb with 413 before routing', async () => {
    const oversized = JSON.stringify({ padding: 'x'.repeat(10 * 1024 + 1) });

    const res = await request(app)
      .post('/api/v1/communities')
      .set('Content-Type', 'application/json')
      .send(oversized);

    expect(res.status).toBe(413);
    expect(res.body.data).toBeNull();
  });

  it('still parses a JSON body at or under 10kb', async () => {
    const withinLimit = JSON.stringify({ padding: 'x'.repeat(1024) });

    const res = await request(app)
      .post('/api/v1/communities')
      .set('Content-Type', 'application/json')
      .send(withinLimit);

    // The body is parsed, so the request reaches validation rather than the parser's 413.
    expect(res.status).not.toBe(413);
  });
});
