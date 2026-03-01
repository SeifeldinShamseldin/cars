import type { StateCreator } from "zustand";

import type {
  ErrorPayload,
  GameStartedPayload,
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

type AppStoreSet = Parameters<StateCreator<AppStore>>[0];

const resetGuessState = () => ({
  currentGuessPayload: undefined,
  selectedOptionId: undefined,
  guessDisabled: false,
  guessResults: undefined,
});

const resetImposterState = () => ({
  currentImposterPayload: undefined,
  imposterResults: undefined,
});

const createPlayingRoomState = (
  state: AppStore,
  gameType: AppStore["gameType"],
  round: number,
  roundEndsAt: number,
) => ({
  ...(state.roomState ??
    createFallbackRoomState(state.roomCode ?? "", gameType, round)),
  gameType,
  status: "PLAYING" as const,
  round,
  roundEndsAt,
});

const createRoundRoomState = (
  state: AppStore,
  round: number,
  roundEndsAt: number,
) => ({
  ...(state.roomState ??
    createFallbackRoomState(state.roomCode ?? "", state.gameType, round)),
  status: "PLAYING" as const,
  round,
  roundEndsAt,
});

const applyCreatedRoom = (
  state: AppStore,
  roomState: RoomCreatedEvt["roomState"],
  playerToken: string,
  hostKey: string,
) => ({
  ...applyRoomState(state, roomState),
  playerToken,
  hostKey,
  lastError: undefined,
});

const applyJoinedRoom = (
  state: AppStore,
  roomState: RoomJoinedEvt["roomState"],
  playerToken: string,
) => ({
  ...applyRoomState(state, roomState),
  playerToken,
  hostKey: undefined,
  lastError: undefined,
  ...resetGuessState(),
  ...resetImposterState(),
});

const applyStartedGame = (state: AppStore, payload: GameStartedPayload) => ({
  ...applyRoomState(
    state,
    createPlayingRoomState(state, payload.gameType, payload.round, payload.roundEndsAt),
  ),
  roomClosesAt: undefined,
  ...resetGuessState(),
  ...resetImposterState(),
  currentGuessPayload:
    payload.gameType === "GUESS_CAR" ? payload.payload : undefined,
  currentImposterPayload:
    payload.gameType === "IMPOSTER" ? payload.payload : undefined,
});

const applyStartedRound = (state: AppStore, payload: RoundStartedPayload) => ({
  ...applyRoomState(
    state,
    createRoundRoomState(state, payload.round, payload.roundEndsAt),
  ),
  roomClosesAt: undefined,
  ...resetGuessState(),
  ...resetImposterState(),
  currentGuessPayload: "mode" in payload.payload ? payload.payload : undefined,
  currentImposterPayload:
    "imageUrl" in payload.payload ? payload.payload : undefined,
});

const applyEndedRound = (state: AppStore, payload: RoundEndedPayload) => ({
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
});

const createClosedRoomState = (): Partial<AppStore> => ({
  ...initialRoomSlice,
  ...initialGuessCarSlice,
  ...initialImposterSlice,
  lastError: {
    code: "ROOM_CLOSED",
    message: "The room has closed.",
  },
});

const applyErrorState = (state: AppStore, payload: ErrorPayload) => ({
  lastError: payload,
  hostKey: payload.code === "NOT_HOST" ? undefined : state.hostKey,
});

export const createAppStoreActions = (
  set: AppStoreSet,
): Pick<
  AppStore,
  | "setConnection"
  | "handleRoomCreated"
  | "handleRoomJoined"
  | "handleRoomState"
  | "handleRoomUpdated"
  | "handleGameStarted"
  | "handleRoundStarted"
  | "handleRoundEnded"
  | "handleGameEnded"
  | "handleRoomClosed"
  | "handleError"
  | "dismissError"
  | "setSelectedOption"
  | "markGuessSubmitted"
  | "resetSession"
> => ({
  setConnection: (isConnected) => set({ isConnected }),

  handleRoomCreated: ({ roomState, playerToken, hostKey }) =>
    set((state) => applyCreatedRoom(state, roomState, playerToken, hostKey)),

  handleRoomJoined: ({ roomState, playerToken }) =>
    set((state) => applyJoinedRoom(state, roomState, playerToken)),

  handleRoomState: ({ roomState }: RoomStateEvt) =>
    set((state) => applyRoomState(state, roomState)),

  handleRoomUpdated: ({ roomState }: RoomUpdatedEvt) =>
    set((state) => applyRoomState(state, roomState)),

  handleGameStarted: (payload) => set((state) => applyStartedGame(state, payload)),

  handleRoundStarted: (payload) => set((state) => applyStartedRound(state, payload)),

  handleRoundEnded: (payload) => set((state) => applyEndedRound(state, payload)),

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

  handleRoomClosed: () => set(createClosedRoomState()),

  handleError: (payload) => set((state) => applyErrorState(state, payload)),

  dismissError: () => set({ lastError: undefined }),

  setSelectedOption: (selectedOptionId) => set({ selectedOptionId }),

  markGuessSubmitted: () => set({ guessDisabled: true }),

  resetSession: () =>
    set({
      ...initialRoomSlice,
      ...initialGuessCarSlice,
      ...initialImposterSlice,
    }),
});
