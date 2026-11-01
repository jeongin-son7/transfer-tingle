"use client";

import { useAdminSession } from "@/lib/auth";
import { useFavoritePlayers } from "@/lib/favorites";
import FavoriteButton from "./FavoriteButton";

export default function RumorFavoriteToggle({ playerName }: { playerName: string }) {
  const session = useAdminSession();
  const { favorites, toggleFavorite } = useFavoritePlayers(session);

  return (
    <FavoriteButton
      isFavorited={favorites.has(playerName)}
      loggedIn={!!session}
      onToggle={() => toggleFavorite(playerName)}
      className="text-2xl"
    />
  );
}
