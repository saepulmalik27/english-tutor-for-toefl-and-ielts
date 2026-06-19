"use server";

import { db } from "@/lib/db";
import { hashPassword, verifyPassword, createSession, destroySession } from "@/lib/auth";
import { redirect } from "next/navigation";

export interface ActionResponse {
  success: boolean;
  error?: string;
}

/**
 * Handle user registration (Sign up)
 */
export async function signUpAction(formData: FormData): Promise<void> {
  const username = formData.get("username")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();
  const rememberMe = formData.get("rememberMe") === "on";

  // 1. Basic validation
  if (!username || !email || !password) {
    redirect("/signup?error=" + encodeURIComponent("Semua kolom harus diisi."));
  }

  if (username.length < 3) {
    redirect("/signup?error=" + encodeURIComponent("Username minimal 3 karakter."));
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    redirect("/signup?error=" + encodeURIComponent("Format email tidak valid."));
  }

  // Password strength validation (at least 8 characters, per secure coder instructions)
  if (password.length < 8) {
    redirect("/signup?error=" + encodeURIComponent("Password minimal 8 karakter."));
  }

  try {
    // 2. Check if user already exists
    const existingUser = await db.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        redirect("/signup?error=" + encodeURIComponent("Email sudah terdaftar."));
      }
      redirect("/signup?error=" + encodeURIComponent("Username sudah digunakan."));
    }

    // 3. Hash password and create user
    const hashedPassword = await hashPassword(password);
    const user = await db.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        xp: 0,
        streak: 0,
        currentIeltsBand: 4.0,
        currentToeflScore: 30,
      },
    });

    // 4. Create session cookie
    await createSession(user.id, user.email, user.username, rememberMe);
  } catch (error: any) {
    if (error && error.message && error.message.includes("NEXT_REDIRECT")) {
      throw error; // Let next.js redirect trigger
    }
    console.error("Signup error:", error);
    redirect("/signup?error=" + encodeURIComponent("Terjadi kesalahan saat mendaftar. Silakan coba lagi."));
  }

  // Redirect to onboarding on success
  redirect("/onboarding");
}

/**
 * Handle user login (Sign in)
 */
export async function signInAction(formData: FormData): Promise<void> {
  const emailOrUsername = formData.get("emailOrUsername")?.toString().trim();
  const password = formData.get("password")?.toString();
  const rememberMe = formData.get("rememberMe") === "on";

  if (!emailOrUsername || !password) {
    redirect("/login?error=" + encodeURIComponent("Semua kolom harus diisi."));
  }

  let isOnboarded = true;
  try {
    // Find user by email or username
    const user = await db.user.findFirst({
      where: {
        OR: [{ email: emailOrUsername.toLowerCase() }, { username: emailOrUsername }],
      },
    });

    if (!user) {
      redirect("/login?error=" + encodeURIComponent("Email/Username atau password salah."));
    }

    // Verify password
    const isPasswordCorrect = await verifyPassword(password, user.password);
    if (!isPasswordCorrect) {
      redirect("/login?error=" + encodeURIComponent("Email/Username atau password salah."));
    }

    isOnboarded = user.isOnboarded;

    // Create session cookie
    await createSession(user.id, user.email, user.username, rememberMe);

    // Update streak if active
    const today = new Date().toDateString();
    const lastActiveDate = user.lastActive?.toDateString();

    if (lastActiveDate !== today) {
      let newStreak = user.streak;
      if (lastActiveDate) {
        const diffTime = Math.abs(new Date(today).getTime() - new Date(lastActiveDate).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          // Consecutive day
          newStreak += 1;
        } else if (diffDays > 1) {
          // Streak broken
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }

      await db.user.update({
        where: { id: user.id },
        data: {
          streak: newStreak,
          lastActive: new Date(),
        },
      });
    }

  } catch (error: any) {
    if (error && error.message && error.message.includes("NEXT_REDIRECT")) {
      throw error; // Let next.js redirect trigger
    }
    console.error("Signin error:", error);
    redirect("/login?error=" + encodeURIComponent("Terjadi kesalahan saat masuk. Silakan coba lagi."));
  }

  if (!isOnboarded) {
    redirect("/onboarding");
  }

  redirect("/dashboard");
}

/**
 * Handle user logout
 */
export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
