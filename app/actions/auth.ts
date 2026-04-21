"use server";

import { cookies } from "next/headers";

export async function verifyAdminPassword(password: string) {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || password !== adminPassword) {
    return { success: false, error: "Invalid password." };
  }

  const cookieStore = await cookies();
  cookieStore.set("admin_token", password, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
  });

  return { success: true };
}