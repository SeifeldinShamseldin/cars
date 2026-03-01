import { create } from "zustand";

import type {
  ErrorPayload,
  GameType,
  GameEndedPayload,
  GameStartedPayload,
  GuessCarRoundEndedResults,
  GuessCarRoundStartedPayload,
  ImposterRoundEndedResults,
  ImposterRoundStartedPayload,
  RoomStatus,
  RoomClosedPayload,
  RoomCreatedEvt,
  RoomJoinedEvt,
  RoomStateEvt,
  RoomStatePublic,
  RoomUpdatedEvt,
  RoundEndedPayload,
  RoundStartedPayload,
} from "../../../shared/types/domain";

type RoomSlice = {
  roomState?: RoomStatePublic;
  roomCode?: string;
  playerToken?: string;
  hostKey?: string;
  gameType: GameType;
  status: RoomStatus;
  version: number;
  roundEndsAt?: number;
  roomClosesAt?: number;
  lastError?: ErrorPayload;
  isConnected: boolean;
};

type GuessCarSlice = {
  currentGuessPayload?: GuessCarRoundStartedPayload;
  selectedOptionId?: string;
  guessDisabled: boolean;
  guessResults?: GuessCarRoundEndedResults;
};

type ImposterSlice = {
  currentImposterPayload?: ImposterRoundStartedPayload;
  imposterResults?: ImposterRoundEndedResults;
};

type AppStore = RoomSlice &
  GuessCarSlice &
  ImposterSlice & {
    setConnection: (isConnected: boolean) => void;
    handleRoomCreated: (payload: RoomCreatedEvt) => void;
    handleRoomJoined: (payload: RoomJoinedEvt) => void;
    handleRoomState: (payload: RoomStateEvt) => void;
    handleRoomUpdated: (payload: RoomUpdatedEvt) => void;
    handleGameStarted: (payload: GameStartedPayload) => void;
    handleRoundStarted: (payload: RoundStartedPayload) => void;
    handleRoundEnded: (payload: RoundEndedPayload) => void;
    handleGameEnded: (payload: GameEndedPayload) => void;
    handleRoomClosed: (payload: RoomClosedPayload) => void;
    handleError: (payload: ErrorPayload) => void;
    dismissError: () => void;
    setSelectedOption: (optionId: string) => void;
    markGuessSubmitted: () => void;
    resetSession: () => void;
  };

const applyRoomState = (
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

const createFallbackRoomState = (
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

export const useAppStore = create<AppStore>((set) => ({
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
  currentGuessPayload: undefined,
  selectedOptionId: undefined,
  guessDisabled: false,
  guessResults: undefined,
  currentImposterPayload: undefined,
  imposterResults: undefined,

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
      roomState: undefined,
      roomCode: undefined,
      playerToken: undefined,
      hostKey: undefined,
      gameType: "NONE",
      status: "LOBBY",
      version: 0,
      roundEndsAt: undefined,
      roomClosesAt: undefined,
      currentGuessPayload: undefined,
      selectedOptionId: undefined,
      guessDisabled: false,
      guessResults: undefined,
      currentImposterPayload: undefined,
      imposterResults: undefined,
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
      roomState: undefined,
      roomCode: undefined,
      playerToken: undefined,
      hostKey: undefined,
      gameType: "NONE",
      status: "LOBBY",
      version: 0,
      roundEndsAt: undefined,
      roomClosesAt: undefined,
      currentGuessPayload: undefined,
      selectedOptionId: undefined,
      guessDisabled: false,
      guessResults: undefined,
      currentImposterPayload: undefined,
      imposterResults: undefined,
    }),
}));
