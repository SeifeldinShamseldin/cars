import { useEffect, useRef, useState } from "react";

import type { HubGame } from "../../features/games/types";
import { socketClient } from "../api/socket";
import type { BottomNavTab } from "../components/BottomNav";
import type { RoomStatePublic } from "../../../shared/types/domain";

type UsePreRoomFlowParams = {
  profileName: string;
  roomState?: RoomStatePublic;
  roomCode?: string;
  playerToken?: string;
  hostKey?: string;
  setActiveTab: (tab: BottomNavTab) => void;
  resetSession: () => void;
};

export const usePreRoomFlow = ({
  profileName,
  roomState,
  roomCode,
  playerToken,
  hostKey,
  setActiveTab,
  resetSession,
}: UsePreRoomFlowParams) => {
  const [activeMode, setActiveMode] = useState<HubGame | null>(null);
  const [joinRoomCode, setJoinRoomCode] = useState("");
  const isLeavingRoomRef = useRef(false);
  const previousModeRef = useRef<HubGame | null>(null);

  useEffect(() => {
    if (!roomState || isLeavingRoomRef.current) {
      return;
    }

    if (roomState.gameType === "GUESS_CAR" || roomState.gameType === "IMPOSTER") {
      previousModeRef.current = roomState.gameType;
    }

    setJoinRoomCode("");
  }, [roomState]);

  const createRoomForGame = (game: HubGame) => {
    if (!profileName.trim()) {
      return;
    }

    isLeavingRoomRef.current = false;
    previousModeRef.current = game;
    socketClient.createRoom({
      nickname: profileName.trim(),
      gameType: game,
    });
  };

  const joinRoomForGame = () => {
    if (!profileName.trim() || !joinRoomCode.trim() || !activeMode) {
      return;
    }

    isLeavingRoomRef.current = false;
    previousModeRef.current = activeMode;
    socketClient.joinRoom({
      roomCode: joinRoomCode.trim().toUpperCase(),
      nickname: profileName.trim(),
    });
  };

  const openModeEntry = (game: HubGame) => {
    isLeavingRoomRef.current = false;
    previousModeRef.current = game;
    setJoinRoomCode("");
    setActiveMode(game);
  };

  const leaveRoomToPreviousMode = () => {
    const nextMode = previousModeRef.current ?? activeMode;

    isLeavingRoomRef.current = true;
    setActiveTab("GAMES");
    if (nextMode) {
      setActiveMode(nextMode);
    }
    setJoinRoomCode("");

    if (roomCode && playerToken) {
      socketClient.leaveRoom({ roomCode, playerToken });
    }

    resetSession();
  };

  const handleRoomClosedToPreviousMode = () => {
    if (isLeavingRoomRef.current) {
      return;
    }

    const nextMode = previousModeRef.current ?? activeMode;
    setActiveTab("GAMES");
    if (nextMode) {
      setActiveMode(nextMode);
    }
    setJoinRoomCode("");
  };

  const handleTabChange = (tab: BottomNavTab) => {
    setActiveMode(null);
    if (tab !== "GAMES") {
      previousModeRef.current = null;
    }
    isLeavingRoomRef.current = false;
    setJoinRoomCode("");
    setActiveTab(tab);
  };

  return {
    setActiveTab: handleTabChange,
    activeMode,
    setActiveMode,
    openModeEntry,
    joinRoomCode,
    setJoinRoomCode,
    createRoomForGame,
    joinRoomForGame,
    leaveRoomToPreviousMode,
    handleRoomClosedToPreviousMode,
  };
};
