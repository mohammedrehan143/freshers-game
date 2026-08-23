"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useRealtime(gameId: string | undefined, onChange: () => void) {
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    if (!gameId) return;
    const c = createClient();
    const ch = c
      .channel(`epoch-${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "epoch_games",
          filter: `epoch_game_id=eq.${gameId}`,
        },
        onChange
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "epoch_players",
          filter: `epoch_game_id=eq.${gameId}`,
        },
        onChange
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "epoch_answers",
          filter: `epoch_game_id=eq.${gameId}`,
        },
        onChange
      )
      .subscribe((s) => setConnected(s === "SUBSCRIBED"));

    return () => {
      c.removeChannel(ch);
    };
  }, [gameId, onChange]);

  return connected;
}

