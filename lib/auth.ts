import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "./db";
import crypto from "crypto";

// Fallback logic for JWT_SECRET following SecureCoder guidelines: Environment -> Random Gen + Log
function getJwtSecret(): string {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }
  if (process.env.NODE_ENV !== "production") {
    console.warn("WARNING(security): JWT_SECRET is not set in environment variables. Using a stable development fallback secret.");
    return "dev_fallback_secret_key_english_tutor_1234567890";
  }
  // Safe fallback for production: generate random hex
  return crypto.randomBytes(32).toString("hex");
}

const JWT_SECRET = getJwtSecret();
const SESSION_COOKIE_NAME = "english_tutor_session";

export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
}

/**
 * Hash password securely using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verify password against hashed value
 */
export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(password, hashed);
}

export async function createSession(userId: string, email: string, username: string, rememberMe = false) {
  const payload: JWTPayload = { userId, email, username };
  const expiresIn = rememberMe ? "30d" : "2h";
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn });

  const cookieStore = await cookies();
  
  const cookieOptions: any = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };

  if (rememberMe) {
    cookieOptions.maxAge = 60 * 60 * 24 * 30; // 30 days
  }

  cookieStore.set(SESSION_COOKIE_NAME, token, cookieOptions);
}

/**
 * Clear session cookie on logout
 */
export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Retrieve currently logged-in user details from the session cookie
 */
export async function getSessionUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    if (!payload || !payload.userId) return null;

    // Verify user still exists in the database
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        email: true,
        xp: true,
        streak: true,
        currentIeltsBand: true,
        currentToeflScore: true,
        targetIeltsBand: true,
        targetToeflScore: true,
        isOnboarded: true,
      },
    });

    return user;
  } catch (error: any) {
    if (
      error &&
      (error.message?.includes("Dynamic server usage") ||
        error.digest === "DYNAMIC_SERVER_USAGE")
    ) {
      throw error;
    }
    console.error("getSessionUser error:", error);
    return null;
  }
}
