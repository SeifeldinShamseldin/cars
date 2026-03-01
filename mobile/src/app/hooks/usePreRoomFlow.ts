import { useEffect, useState } from "react";

import { socketClient } from "../../shared/api/socket";
import type { BottomNavTab } from "../../shared/components/BottomNav";
import { prefetchCarDetail } from "../../shared/hooks/useCarCatalog";
import type { HubGame } from "../../features/games/types";
import type { GameType, RoomStatePublic } from "../../../shared/types/domain";

type UsePreRoomFlowParams = {
  profileName: string;
  roomState?: RoomStatePublic;
  roomCode?: string;
  playerToken?: string;
  hostKey?: string;
  resetSession: () => void;
};

export const usePreRoomFlow = ({
  profileName,
  roomState,
  roomCode,
  playerToken,
  hostKey,
  resetSession,
}: UsePreRoomFlowParams) => {
  const [activeTab, setActiveTab] = useState<BottomNavTab>("SELL");
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [sellScrollOffset, setSellScrollOffset] = useState(0);
  const [updatesScrollOffset, setUpdatesScrollOffset] = useState(0);
  const [activeMode, setActiveMode] = useState<HubGame | null>(null);
  const [joinRoomCode, setJoinRoomCode] = useState("");
  const [pendingAutoSelectGame, setPendingAutoSelectGame] = useState<
    "GUESS_CAR" | "IMPOSTER" | null
  >(null);

  useEffect(() => {
    if (!roomState) {
      return;
    }

    setActiveMode(null);
    setJoinRoomCode("");
    setSelectedCarId(null);
  }, [roomState]);

  useEffect(() => {
    if (
      !pendingAutoSelectGame ||
      !roomState ||
      !roomCode ||
      !hostKey ||
      roomState.status !== "LOBBY"
    ) {
      return;
    }

    if (roomState.gameType === pendingAutoSelectGame) {
      setPendingAutoSelectGame(null);
      return;
    }

    socketClient.selectGame({
      roomCode,
      hostKey,
      gameType: pendingAutoSelectGame,
    });
    setPendingAutoSelectGame(null);
  }, [hostKey, pendingAutoSelectGame, roomCode, roomState]);

  const createRoomForGame = (game: "GUESS_CAR" | "IMPOSTER") => {
    if (!profileName.trim()) {
      return;
    }

    setPendingAutoSelectGame(game);
    socketClient.createRoom({ nickname: profileName.trim() });
  };

  const joinRoomForGame = () => {
    if (!profileName.trim() || !joinRoomCode.trim() || !activeMode) {
      return;
    }

    socketClient.joinRoom({
      roomCode: joinRoomCode.trim().toUpperCase(),
      nickname: profileName.trim(),
    });
  };

  const returnToPreviousMode = (gameType: GameType) => {
    setActiveTab("GAMES");
    setActiveMode(gameType === "GUESS_CAR" || gameType === "IMPOSTER" ? gameType : null);
  };

  const leaveRoomToPreviousMode = (gameType: GameType) => {
    returnToPreviousMode(gameType);
    if (roomCode && playerToken) {
      socketClient.leaveRoom({ roomCode, playerToken });
    }

    resetSession();
  };

  const openCarDetail = (carId: string) => {
    void prefetchCarDetail(carId);
    setSelectedCarId(carId);
  };

  const handleTabChange = (tab: BottomNavTab) => {
    if (tab === activeTab) {
      return;
    }

    setActiveTab(tab);
    setActiveMode(null);
    setSelectedCarId(null);
    setJoinRoomCode("");
  };

  return {
    activeTab,
    setActiveTab: handleTabChange,
    selectedCarId,
    setSelectedCarId,
    sellScrollOffset,
    setSellScrollOffset,
    updatesScrollOffset,
    setUpdatesScrollOffset,
    activeMode,
    setActiveMode,
    joinRoomCode,
    setJoinRoomCode,
    isModeDetailScreen: !roomState && (activeMode === "GUESS_CAR" || activeMode === "IMPOSTER"),
    createRoomForGame,
    joinRoomForGame,
    leaveRoomToPreviousMode,
    openCarDetail,
  };
};
