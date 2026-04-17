import { afterAll, afterEach, beforeAll } from "vitest";
import { setupServer } from "msw/node";
import { HttpResponse, http } from "msw";
import "@testing-library/jest-dom";

export const mockApiUrl = "http://localhost:8000";

export const handlers = [
  http.post(`${mockApiUrl}/login`, async () => {
    return HttpResponse.json({
      access_token:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwicm9sZSI6ImJpZGRlciIsImV4cCI6OTk5OTk5OTk5OX0.mock",
      token_type: "bearer",
    });
  }),
  http.post(`${mockApiUrl}/register`, async () => {
    return HttpResponse.json({
      id: 1,
      email: "test@example.com",
      role: "bidder",
      created_at: new Date().toISOString(),
    });
  }),
  http.post(`${mockApiUrl}/admin/login`, async () => {
    return HttpResponse.json({
      access_token:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyIiwicm9sZSI6ImFkbWluIiwiZXhwIjo5OTk5OTk5OTk5fQ.mock",
      token_type: "bearer",
    });
  }),
  http.get(`${mockApiUrl}/artworks`, () => {
    return HttpResponse.json([
      {
        id: 1,
        title: "Test Artwork",
        artist_name: "Test Artist",
        description: "Test description",
        images: [
          {
            url: "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_1200/sample.jpg",
            thumbnail_url: "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_fill,g_auto,w_400,h_400/sample.jpg",
          },
        ],
        starting_price: 10000,
        current_highest_bid: 15000,
        current_highest_bidder_id: 2,
        auction_end_time: new Date(Date.now() + 86400000).toISOString(),
        status: "active",
        created_at: new Date().toISOString(),
      },
    ]);
  }),
];

export const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
