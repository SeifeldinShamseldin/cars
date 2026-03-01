import type { GameType, RoomStatePublic } from "../../../../shared/types/domain";

import type { AppStore, RoomSlice } from "../types";

export const initialRoomSlice: RoomSlice = {
  roomState: undefined,
  roomCode: undefined,
  playerToken: undefined,
  hostKey: undefined,
  gameType: "NONE",
  status: "LOBBY",
  version: 0,
  roundEndsAt: undefined,
  roomClosesAt: undefined,
  lastError: undefined,
  isConnected: false,
};

export const applyRoomState = (
  state: AppStore,
  roomState: RoomStatePublic,
): Partial<AppStore> => ({
  roomState,
  roomCode: roomState.roomCode,
  gameType: roomState.gameType,
  status: roomState.status,
  version: roomState.version,
  roundEndsAt: roomState.roundEndsAt,
  roomClosesAt:
    roomState.status === "CLOSING" ? state.roomClosesAt : undefined,
});

export const createFallbackRoomState = (
  roomCode: string,
  gameType: GameType,
  round: number,
): RoomStatePublic => ({
  roomCode,
  hostId: "",
  players: [],
  gameType,
  status: "PLAYING",
  round,
  version: 0,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});
