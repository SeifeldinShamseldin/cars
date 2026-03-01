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
  hostReconnectTimer?: NodeJS.Timeout;
  roomCloseTimer?: NodeJS.Timeout;
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
