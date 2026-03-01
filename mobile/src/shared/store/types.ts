import type {
  ErrorPayload,
  GameEndedPayload,
  GameStartedPayload,
  GameType,
  GuessCarRoundEndedResults,
  GuessCarRoundStartedPayload,
  ImposterRoundEndedResults,
  ImposterRoundStartedPayload,
  RoomClosedPayload,
  RoomCreatedEvt,
  RoomJoinedEvt,
  RoomStateEvt,
  RoomStatePublic,
  RoomStatus,
  RoomUpdatedEvt,
  RoundEndedPayload,
  RoundStartedPayload,
} from "../../../shared/types/domain";

export type RoomSlice = {
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

export type GuessCarSlice = {
  currentGuessPayload?: GuessCarRoundStartedPayload;
  selectedOptionId?: string;
  guessDisabled: boolean;
  guessResults?: GuessCarRoundEndedResults;
};

export type ImposterSlice = {
  currentImposterPayload?: ImposterRoundStartedPayload;
  imposterResults?: ImposterRoundEndedResults;
};

export type AppStore = RoomSlice &
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
