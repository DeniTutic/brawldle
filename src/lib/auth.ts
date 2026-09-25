import "server-only";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { client, db } from "./db";

export const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export const auth = betterAuth({
  database: mongodbAdapter(db, { client }),
  socialProviders: googleEnabled
    ? { google: { clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET!, prompt: "select_account" } }
    : {},
  session: { expiresIn: 60 * 60 * 24 * 60, cookieCache: { enabled: true, maxAge: 5 * 60 } },
  plugins: [nextCookies()],
});
