import type { GameType, RoomStatePublic } from "../../../../shared/types/domain";

import type { AppStore, RoomSlice } from "../types";

export const initialRoomSlice: RoomSlice = {
  roomState: undefined,
  roomCode: undefined,
  playerToken: undefined,
  hostKey: undefined,
  roundEndsAt: undefined,
  roomClosesAt: undefined,
  lastError: undefined,
};

export const applyRoomState = (
  state: AppStore,
  roomState: RoomStatePublic,
): Partial<AppStore> => ({
  roomState,
  roomCode: roomState.roomCode,
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
