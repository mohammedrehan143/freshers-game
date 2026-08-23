import crypto from "crypto";
import { cookies } from "next/headers";
const cookieName = "epoch-admin";
const signature = () => crypto.createHmac("sha256", process.env.ADMIN_PASSWORD || "").update("epoch-2026-admin").digest("hex");
export async function isAdmin() { return (await cookies()).get(cookieName)?.value === signature(); }
export function adminCookie() { return { name: cookieName, value: signature(), httpOnly: true, sameSite: "strict" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 12 }; }
