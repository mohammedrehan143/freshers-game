import { NextRequest, NextResponse } from "next/server";
import { adminCookie } from "@/lib/admin";
export async function POST(req: NextRequest) { const { password } = await req.json(); if (!process.env.ADMIN_PASSWORD) return NextResponse.json({error:"Host password is not configured. Add ADMIN_PASSWORD to .env.local and restart the server."},{status:503}); if (password !== process.env.ADMIN_PASSWORD) return NextResponse.json({error:"Incorrect host password."},{status:401}); const res=NextResponse.json({ok:true}); res.cookies.set(adminCookie()); return res; }
