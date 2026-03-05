import type {
  ErrorPayload,
  GameEndedPayload,
  GameStartedPayload,
  GuessCarRoundEndedResults,
  GuessCarRoundStartedPayload,
  ImposterRoundEndedResults,
  ImposterRoundStartedPayload,
  RoomCreatedEvt,
  RoomJoinedEvt,
  RoomStateEvt,
  RoomStatePublic,
  RoomUpdatedEvt,
  RoundEndedPayload,
  RoundStartedPayload,
} from "../../../shared/types/domain";
import type { SellerProfile } from "../api/sellerAccess";
import type { SellerAccessSlice } from "./slices/sellerAccessSlice";

export type RoomSlice = {
  roomState?: RoomStatePublic;
  roomCode?: string;
  playerToken?: string;
  hostKey?: string;
  roundEndsAt?: number;
  roomClosesAt?: number;
  lastError?: ErrorPayload;
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
  ImposterSlice &
  SellerAccessSlice & {
    setSellerAccessSession: (payload: {
      accessToken: string;
      refreshToken: string;
      phone: string;
      hasProfile: boolean;
    }) => void;
    clearSellerAccessSession: () => void;
    setSellerProfile: (profile: SellerProfile) => void;
    handleRoomCreated: (payload: RoomCreatedEvt) => void;
    handleRoomJoined: (payload: RoomJoinedEvt) => void;
    handleRoomState: (payload: RoomStateEvt) => void;
    handleRoomUpdated: (payload: RoomUpdatedEvt) => void;
    handleGameStarted: (payload: GameStartedPayload) => void;
    handleRoundStarted: (payload: RoundStartedPayload) => void;
    handleRoundEnded: (payload: RoundEndedPayload) => void;
    handleGameEnded: (payload: GameEndedPayload) => void;
    handleRoomClosed: () => void;
    handleError: (payload: ErrorPayload) => void;
    dismissError: () => void;
    setSelectedOption: (optionId: string) => void;
    markGuessSubmitted: () => void;
    resetSession: () => void;
  };
