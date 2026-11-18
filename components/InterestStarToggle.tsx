"use client";

import { useInterestedPlayers } from "@/lib/interests";
import InterestStarButton from "./InterestStarButton";

export default function InterestStarToggle({ playerName }: { playerName: string }) {
  const { interests, toggleInterest } = useInterestedPlayers();

  return (
    <InterestStarButton
      isInterested={interests.has(playerName)}
      onToggle={() => toggleInterest(playerName)}
      className="text-2xl"
    />
  );
}
