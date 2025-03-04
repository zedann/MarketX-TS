const request = require("supertest");
const express = require("express");
const passport = require("passport");
const authRouter = require("../src/routes/auth");
const { HTTP_CODES } = require("../src/types");

const app = express();
app.use(passport.initialize());
app.use(passport.session());
app.use("/auth", authRouter);

describe("Auth Routes", () => {
  it("should redirect to Google for authentication", async () => {
    const response = await request(app).get("/auth/google");
    expect(response.status).toBe(302);
    expect(response.header.location).toContain("accounts.google.com");
  });

  it("should handle Google callback and redirect on failure", async () => {
    jest
      .spyOn(passport, "authenticate")
      .mockImplementation((strategy, options, callback) => {
        return (req, res, next) => {
          if (callback) {
            callback(null, false, { message: "Authentication failed" });
          }
        };
      });

    const response = await request(app).get("/auth/google/callback");
    expect(response.status).toBe(302);
    expect(response.header.location).toBe("/login");
  });

  it("should return user profile if authenticated", async () => {
    const mockUser = { id: "123", name: "Test User" };
    app.use((req, res, next) => {
      req.user = mockUser;
      next();
    });

    const response = await request(app).get("/auth/profile");
    expect(response.status).toBe(HTTP_CODES.OK);
    expect(response.body).toEqual(mockUser);
  });

  it("should return 401 if not authenticated", async () => {
    const response = await request(app).get("/auth/profile");
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Not authenticated" });
  });
});
