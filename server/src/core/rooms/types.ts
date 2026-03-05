import type {
  GameEndedPayload,
  GameType,
  GuessCarRoundStartedPayload,
  PlayerPublic,
  RoomStatus,
} from "../../../shared/types/domain";

export type InternalPlayer = PlayerPublic & {
  playerToken: string;
  socketId?: string;
  connected: boolean;
  disconnectedAt?: number;
};

export type AdminRoomPlayerSnapshot = {
  id: string;
  nickname: string;
  joinedAt: number;
  connected: boolean;
  disconnectedAt?: number;
  isHost: boolean;
};

export type AdminRoomSnapshot = {
  roomCode: string;
  hostId: string;
  gameType: GameType;
  status: RoomStatus;
  round: number;
  version: number;
  createdAt: number;
  updatedAt: number;
  roundEndsAt?: number;
  roomClosesAt?: number;
  cleanupExpiresAt?: number;
  hostReconnectExpiresAt?: number;
  roomCloseExpiresAt?: number;
  activeRoundKind?: ActiveRound["kind"];
  nextRoundStartsAt?: number;
  playerCount: number;
  connectedCount: number;
  players: AdminRoomPlayerSnapshot[];
};

export type AdminRoomMonitorSnapshot = {
  activeRoomCount: number;
  totalPlayerCount: number;
  connectedPlayerCount: number;
  rooms: AdminRoomSnapshot[];
};

export type GuessCarActiveRound = {
  kind: "GUESS_CAR";
  round: number;
  startedAt: number;
  endsAt: number;
  startedPayload: GuessCarRoundStartedPayload;
  correctOptionId: string;
  answeredPlayerIds: Set<string>;
  submissionsByPlayerId: Map<
    string,
    {
      optionId: string;
      submittedAt: number;
      isCorrect: boolean;
    }
  >;
  guessAttemptsByPlayerId: Map<string, number>;
  timeout?: NodeJS.Timeout;
  nextRoundTimer?: NodeJS.Timeout;
  nextRoundStartsAt?: number;
};

export type ImposterActiveRound = {
  kind: "IMPOSTER";
  round: number;
  startedAt: number;
  endsAt: number;
  imposterPlayerId: string;
  normalCarImageUrl: string;
  imposterCarImageUrl: string;
  prompt: string;
  timeout?: NodeJS.Timeout;
  nextRoundTimer?: NodeJS.Timeout;
  nextRoundStartsAt?: number;
};

export type ActiveRound = GuessCarActiveRound | ImposterActiveRound;

export type InternalRoom = {
  roomCode: string;
  hostId: string;
  hostKey: string;
  players: InternalPlayer[];
  gameType: GameType;
  status: RoomStatus;
  round: number;
  roundEndsAt?: number;
  version: number;
  createdAt: number;
  updatedAt: number;
  cleanupTimer?: NodeJS.Timeout;
  cleanupExpiresAt?: number;
  hostReconnectTimer?: NodeJS.Timeout;
  hostReconnectExpiresAt?: number;
  roomCloseTimer?: NodeJS.Timeout;
  roomCloseExpiresAt?: number;
  activeRound?: ActiveRound;
  roundResults: Array<{
    round: number;
    winnerNickname?: string;
  }>;
  guessScoreByPlayerId: Map<string, number>;
  usedQuestionIds: Set<string>;
  roomClosesAt?: number;
  gameEndedPayload?: GameEndedPayload;
};

export type PlayerLookup = {
  room: InternalRoom;
  player: InternalPlayer;
};
