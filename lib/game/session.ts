"use client";
const KEY = "epoch-player-session";
export type StoredSession = { playerId:string; token:string; gameId:string };
export function getSession(): StoredSession | null { try { const raw=localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; } catch { return null; } }
export function setSession(value: StoredSession) { localStorage.setItem(KEY, JSON.stringify(value)); }
