/**
 * @fileoverview Shared domain + socket payload types (frontend + backend).
 * Server is authoritative. Public room state contains no secrets.
 */

export type GameType = "NONE" | "GUESS_CAR" | "IMPOSTER";
export type RoomStatus = "LOBBY" | "PLAYING" | "CLOSING";

export type Id = string;
export type RoomCode = string;

export type PlayerPublic = {
  id: Id;
  nickname: string;
  joinedAt: number;
};

export type RoomStatePublic = {
  roomCode: RoomCode;
  hostId: Id;
  players: PlayerPublic[];
  gameType: GameType;
  status: RoomStatus;
  round: number;
  roundEndsAt?: number;
  version: number;
  createdAt: number;
  updatedAt: number;
};

export type GuessCarOption = {
  id: Id;
  label: string;
  imageUrl?: string;
};

export type GuessCarClue = {
  country?: string;
  cc?: number;
  hp?: number;
  torque?: number;
  special?: string;
};

export type GuessCarRoundStartedPayload =
  | {
      mode: "CLUE";
      questionId: Id;
      clue: GuessCarClue;
      options: [
        GuessCarOption,
        GuessCarOption,
        GuessCarOption,
        GuessCarOption,
      ];
    }
  | {
      mode: "PART";
      questionId: Id;
      partImageUrl: string;
      options: [
        GuessCarOption,
        GuessCarOption,
        GuessCarOption,
        GuessCarOption,
      ];
    };

export type GuessCarRoundEndedResults = {
  correctOptionId: Id;
  allAnswered: boolean;
  winnerPlayerId?: Id;
  winnerNickname?: string;
  answeredCount: number;
  standings: Array<{
    playerId: Id;
    nickname: string;
    roundPoints: number;
    totalPoints: number;
    answered: boolean;
    isCorrect: boolean;
    answerRank?: number;
  }>;
};

export type ImposterRoundStartedPayload = {
  imageUrl: string;
  prompt: string;
};

export type ImposterRoundEndedResults = {
  imposterPlayerId: Id;
  imposterNickname: string;
  normalCarImageUrl: string;
  imposterCarImageUrl: string;
};

export type GameStartedPayload =
  | {
      gameType: "GUESS_CAR";
      round: number;
      roundEndsAt: number;
      payload: GuessCarRoundStartedPayload;
    }
  | {
      gameType: "IMPOSTER";
      round: number;
      roundEndsAt: number;
      payload: ImposterRoundStartedPayload;
    };

export type RoundStartedPayload =
  | {
      round: number;
      roundEndsAt: number;
      payload: GuessCarRoundStartedPayload;
    }
  | {
      round: number;
      roundEndsAt: number;
      payload: ImposterRoundStartedPayload;
    };

export type RoundEndedPayload =
  | {
      round: number;
      results: GuessCarRoundEndedResults;
      nextRoundStartsAt?: number;
      gameEndsAt?: number;
      roomClosesAt?: number;
    }
  | {
      round: number;
      results: ImposterRoundEndedResults;
      nextRoundStartsAt?: number;
      gameEndsAt?: number;
      roomClosesAt?: number;
    };

export type GameEndedPayload = {
  results: {
    rounds: Array<{
      round: number;
      winnerNickname?: string;
    }>;
    standings?: Array<{
      playerId: Id;
      nickname: string;
      totalPoints: number;
    }>;
  };
  roomClosesAt: number;
};

export type RoomClosedPayload = {
  reason: "GAME_FINISHED" | "HOST_EXITED";
};

export type ErrorPayload = {
  code: string;
  message: string;
};

export type CatalogRefreshPayload = {
  reason: "ADMIN_FORCE_UPDATE";
  requestedAt: number;
};

export type RoomCreateCmd = {
  nickname: string;
  gameType?: "GUESS_CAR" | "IMPOSTER";
};
export type RoomJoinCmd = { roomCode: RoomCode; nickname: string };
export type RoomLeaveCmd = { roomCode: RoomCode; playerToken: string };
export type RoomSyncCmd = {
  roomCode: RoomCode;
  playerToken: string;
  lastVersion: number;
};

export type GameSelectCmd = {
  roomCode: RoomCode;
  hostKey: string;
  gameType: "GUESS_CAR" | "IMPOSTER";
};
export type GameStartCmd = { roomCode: RoomCode; hostKey: string };
export type GameExitCmd = { roomCode: RoomCode; hostKey: string };
export type GameRematchCmd = { roomCode: RoomCode; hostKey: string };
export type GameNextCmd = { roomCode: RoomCode; hostKey: string };

export type GuessSubmitCmd = {
  roomCode: RoomCode;
  playerToken: string;
  round: number;
  optionId: Id;
  clientTime: number;
};

export type RoomCreatedEvt = {
  roomState: RoomStatePublic;
  playerToken: string;
  hostKey: string;
};

export type RoomJoinedEvt = {
  roomState: RoomStatePublic;
  playerToken: string;
};

export type RoomStateEvt = { roomState: RoomStatePublic };
export type RoomUpdatedEvt = { roomState: RoomStatePublic };

export type ClientToServerEvents = {
  "room.create": (payload: RoomCreateCmd) => void;
  "room.join": (payload: RoomJoinCmd) => void;
  "room.leave": (payload: RoomLeaveCmd) => void;
  "room.sync": (payload: RoomSyncCmd) => void;
  "game.select": (payload: GameSelectCmd) => void;
  "game.start": (payload: GameStartCmd) => void;
  "game.exit": (payload: GameExitCmd) => void;
  "game.rematch": (payload: GameRematchCmd) => void;
  "game.next": (payload: GameNextCmd) => void;
  "guess.submit": (payload: GuessSubmitCmd) => void;
};

export type ServerToClientEvents = {
  "room.created": (payload: RoomCreatedEvt) => void;
  "room.joined": (payload: RoomJoinedEvt) => void;
  "room.state": (payload: RoomStateEvt) => void;
  "room.updated": (payload: RoomUpdatedEvt) => void;
  "room.closed": (payload: RoomClosedPayload) => void;
  "catalog.refresh": (payload: CatalogRefreshPayload) => void;
  "game.started": (payload: GameStartedPayload) => void;
  "round.started": (payload: RoundStartedPayload) => void;
  "round.ended": (payload: RoundEndedPayload) => void;
  "game.ended": (payload: GameEndedPayload) => void;
  "error": (payload: ErrorPayload) => void;
};
