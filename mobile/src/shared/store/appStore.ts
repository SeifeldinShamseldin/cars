import { create } from "zustand";

import type {
  ErrorPayload,
  GameEndedPayload,
  GameStartedPayload,
  RoomClosedPayload,
  RoomCreatedEvt,
  RoomJoinedEvt,
  RoomStateEvt,
  RoomUpdatedEvt,
  RoundEndedPayload,
  RoundStartedPayload,
} from "../../../shared/types/domain";
import { initialGuessCarSlice } from "./slices/guessCarSlice";
import { initialImposterSlice } from "./slices/imposterSlice";
import {
  applyRoomState,
  createFallbackRoomState,
  initialRoomSlice,
} from "./slices/roomSlice";
import type { AppStore } from "./types";

export const useAppStore = create<AppStore>((set) => ({
  ...initialRoomSlice,
  ...initialGuessCarSlice,
  ...initialImposterSlice,

  setConnection: (isConnected) => set({ isConnected }),

  handleRoomCreated: ({ roomState, playerToken, hostKey }) =>
    set((state) => ({
      ...applyRoomState(state, roomState),
      playerToken,
      hostKey,
      lastError: undefined,
      currentGuessPayload: state.currentGuessPayload,
      selectedOptionId: state.selectedOptionId,
      guessDisabled: state.guessDisabled,
      guessResults: state.guessResults,
      currentImposterPayload: state.currentImposterPayload,
      imposterResults: state.imposterResults,
    })),

  handleRoomJoined: ({ roomState, playerToken }) =>
    set((state) => ({
      ...applyRoomState(state, roomState),
      playerToken,
      hostKey: undefined,
      lastError: undefined,
      currentGuessPayload: undefined,
      selectedOptionId: undefined,
      guessDisabled: false,
      guessResults: undefined,
      currentImposterPayload: undefined,
      imposterResults: undefined,
    })),

  handleRoomState: ({ roomState }) =>
    set((state) => ({
      ...applyRoomState(state, roomState),
    })),

  handleRoomUpdated: ({ roomState }) =>
    set((state) => ({
      ...applyRoomState(state, roomState),
    })),

  handleGameStarted: (payload) =>
    set((state) => ({
      ...applyRoomState(state, {
        ...(state.roomState ??
          createFallbackRoomState(
            state.roomCode ?? "",
            payload.gameType,
            payload.round,
          )),
        gameType: payload.gameType,
        status: "PLAYING",
        round: payload.round,
        roundEndsAt: payload.roundEndsAt,
      }),
      roomClosesAt: undefined,
      currentGuessPayload:
        payload.gameType === "GUESS_CAR" ? payload.payload : undefined,
      selectedOptionId: undefined,
      guessDisabled: false,
      guessResults: undefined,
      currentImposterPayload:
        payload.gameType === "IMPOSTER" ? payload.payload : undefined,
      imposterResults: undefined,
    })),

  handleRoundStarted: (payload) =>
    set((state) => ({
      ...applyRoomState(state, {
        ...(state.roomState ??
          createFallbackRoomState(
            state.roomCode ?? "",
            state.gameType,
            payload.round,
          )),
        status: "PLAYING",
        round: payload.round,
        roundEndsAt: payload.roundEndsAt,
      }),
      roomClosesAt: undefined,
      currentGuessPayload:
        "mode" in payload.payload ? payload.payload : undefined,
      selectedOptionId: undefined,
      guessDisabled: false,
      guessResults: undefined,
      currentImposterPayload:
        "imageUrl" in payload.payload ? payload.payload : undefined,
      imposterResults: undefined,
    })),

  handleRoundEnded: (payload) =>
    set((state) => ({
      roomState: state.roomState
        ? {
            ...state.roomState,
            round: payload.round,
            roundEndsAt: undefined,
          }
        : state.roomState,
      roundEndsAt: undefined,
      roomClosesAt: payload.roomClosesAt,
      guessResults:
        "correctOptionId" in payload.results ? payload.results : undefined,
      guessDisabled:
        "correctOptionId" in payload.results ? true : state.guessDisabled,
      imposterResults:
        "imposterPlayerId" in payload.results ? payload.results : undefined,
    })),

  handleGameEnded: (payload) =>
    set((state) => ({
      roomClosesAt: payload.roomClosesAt,
      status: "CLOSING",
      roomState: state.roomState
        ? {
            ...state.roomState,
            status: "CLOSING",
          }
        : state.roomState,
    })),

  handleRoomClosed: () =>
    set({
      ...initialRoomSlice,
      ...initialGuessCarSlice,
      ...initialImposterSlice,
      lastError: {
        code: "ROOM_CLOSED",
        message: "The room has closed.",
      },
    }),

  handleError: (payload) =>
    set((state) => ({
      lastError: payload,
      hostKey: payload.code === "NOT_HOST" ? undefined : state.hostKey,
    })),

  dismissError: () => set({ lastError: undefined }),

  setSelectedOption: (selectedOptionId) => set({ selectedOptionId }),

  markGuessSubmitted: () => set({ guessDisabled: true }),

  resetSession: () =>
    set({
      ...initialRoomSlice,
      ...initialGuessCarSlice,
      ...initialImposterSlice,
    }),
}));
