import type {
  ClientToServerEvents,
  ErrorPayload,
  GameEndedPayload,
  GameStartedPayload,
  ImposterRoundStartedPayload,
  RoundEndedPayload,
  RoundStartedPayload,
  ServerToClientEvents,
} from "../../../shared/types/domain";
import { EVENTS } from "../../../shared/types/events";
import {
  INTERMISSION_MS,
  MAX_PLAYERS,
  MIN_PLAYERS_IMPOSTER,
  RATE_LIMIT_MAX_COMMANDS,
  RATE_LIMIT_MAX_GUESS_SUBMITS_PER_ROUND,
  RATE_LIMIT_WINDOW_MS,
  ROOM_CLOSE_AFTER_GAME_MS,
  ROUND_MAX_MS,
  TOTAL_QUESTIONS,
} from "../../config/constants";
import { createSecret, shuffle } from "../../utils/id";
import {
  asTrimmedString,
  hasNumberField,
  hasStringField,
  isRecord,
} from "../../utils/validation";
import { buildGuessQuestion, buildImposterImages } from "./questionFactory";
import { RoomManager } from "../rooms/roomManager";
import type {
  GuessCarActiveRound,
  ImposterActiveRound,
  InternalPlayer,
  InternalRoom,
} from "../rooms/types";
import type { Server, Socket } from "socket.io";

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;

type RateLimitState = {
  count: number;
  resetAt: number;
};

export class GameService {
  private readonly roomManager = new RoomManager();

  private readonly rateLimits = new Map<string, RateLimitState>();

  public constructor(private readonly io: TypedServer) {}

  public handleRoomCreate(socket: TypedSocket, payload: unknown): void {
    if (this.roomManager.getSocketBinding(socket.id)) {
      this.emitError(socket, "SOCKET_ALREADY_BOUND", "This socket is already attached to a room.");
      return;
    }

    if (!isRecord(payload) || !hasStringField(payload, "nickname", { maxLength: 24 })) {
      this.emitError(socket, "INVALID_CREATE", "Nickname is required.");
      return;
    }

    const nickname = asTrimmedString(payload.nickname);
    if (!nickname) {
      this.emitError(socket, "INVALID_CREATE", "Nickname is required.");
      return;
    }

    const { room, player, hostKey } = this.roomManager.createRoom(nickname, socket.id);
    socket.join(room.roomCode);
    socket.emit(EVENTS.S2C.ROOM_CREATED, {
      roomState: this.roomManager.toPublicRoomState(room),
      playerToken: player.playerToken,
      hostKey,
    });
  }

  public handleRoomJoin(socket: TypedSocket, payload: unknown): void {
    if (this.roomManager.getSocketBinding(socket.id)) {
      this.emitError(socket, "SOCKET_ALREADY_BOUND", "This socket is already attached to a room.");
      return;
    }

    if (
      !isRecord(payload) ||
      !hasStringField(payload, "roomCode", { maxLength: 8 }) ||
      !hasStringField(payload, "nickname", { maxLength: 24 })
    ) {
      this.emitError(socket, "INVALID_JOIN", "Room code and nickname are required.");
      return;
    }

    const roomCode = asTrimmedString(payload.roomCode)?.toUpperCase();
    const nickname = asTrimmedString(payload.nickname);
    if (!roomCode || !nickname) {
      this.emitError(socket, "INVALID_JOIN", "Room code and nickname are required.");
      return;
    }

    const room = this.roomManager.getRoom(roomCode);
    if (!room) {
      this.emitError(socket, "ROOM_NOT_FOUND", "Room not found.");
      return;
    }

    if (room.players.length >= MAX_PLAYERS) {
      this.emitError(socket, "ROOM_FULL", "Room already has the maximum number of players.");
      return;
    }

    const joined = this.roomManager.joinRoom(roomCode, nickname, socket.id);
    if (!joined) {
      this.emitError(socket, "ROOM_NOT_FOUND", "Room not found.");
      return;
    }

    socket.join(roomCode);
    socket.emit(EVENTS.S2C.ROOM_JOINED, {
      roomState: this.roomManager.toPublicRoomState(joined.room),
      playerToken: joined.player.playerToken,
    });
    this.broadcastRoomUpdate(joined.room);
  }

  public handleRoomLeave(socket: TypedSocket, payload: unknown): void {
    if (
      !isRecord(payload) ||
      !hasStringField(payload, "roomCode", { maxLength: 8 }) ||
      !hasStringField(payload, "playerToken", { maxLength: 96 })
    ) {
      this.emitError(socket, "INVALID_LEAVE", "Room code and player token are required.");
      return;
    }

    const roomCode = asTrimmedString(payload.roomCode)?.toUpperCase();
    const playerToken = asTrimmedString(payload.playerToken);
    if (!roomCode || !playerToken) {
      this.emitError(socket, "INVALID_LEAVE", "Room code and player token are required.");
      return;
    }

    const previousHostId = this.roomManager.getRoom(roomCode)?.hostId;
    const { room, removedPlayer } = this.roomManager.removePlayer(roomCode, playerToken);
    if (!room || !removedPlayer) {
      this.emitError(socket, "ROOM_NOT_FOUND", "Room or player not found.");
      return;
    }

    socket.leave(roomCode);

    if (room.players.length === 0) {
      this.roomManager.deleteRoom(room.roomCode);
      return;
    }

    if (this.roomManager.countConnectedPlayers(room) === 0) {
      this.roomManager.scheduleCleanup(room, () => {
        this.roomManager.deleteRoom(room.roomCode);
      });
    }

    if (previousHostId === removedPlayer.id) {
      this.sendHostCredentialsIfNeeded(
        room,
        room.players.find((player) => player.id === room.hostId),
      );
    }
    this.broadcastRoomUpdate(room);
  }

  public handleRoomSync(socket: TypedSocket, payload: unknown): void {
    if (
      !isRecord(payload) ||
      !hasStringField(payload, "roomCode", { maxLength: 8 }) ||
      !hasStringField(payload, "playerToken", { maxLength: 96 }) ||
      !hasNumberField(payload, "lastVersion")
    ) {
      this.emitError(socket, "INVALID_SYNC", "Room sync payload is invalid.");
      return;
    }

    const roomCode = asTrimmedString(payload.roomCode)?.toUpperCase();
    const playerToken = asTrimmedString(payload.playerToken);
    if (!roomCode || !playerToken) {
      this.emitError(socket, "INVALID_SYNC", "Room sync payload is invalid.");
      return;
    }

    const synced = this.roomManager.syncPlayer(roomCode, playerToken, socket.id);
    if (!synced) {
      this.emitError(socket, "SYNC_FAILED", "Unable to restore room session.");
      return;
    }

    socket.join(roomCode);
    socket.emit(EVENTS.S2C.ROOM_STATE, {
      roomState: this.roomManager.toPublicRoomState(synced.room),
    });

    this.sendHostCredentialsIfNeeded(synced.room, synced.player);
    this.emitLiveStateToPlayer(socket, synced.room, synced.player);
    this.broadcastRoomUpdate(synced.room);
  }

  public handleGameSelect(socket: TypedSocket, payload: unknown): void {
    if (
      !isRecord(payload) ||
      !hasStringField(payload, "roomCode", { maxLength: 8 }) ||
      !hasStringField(payload, "hostKey", { maxLength: 96 }) ||
      !hasStringField(payload, "gameType", { maxLength: 16 })
    ) {
      this.emitError(socket, "INVALID_GAME_SELECT", "Game selection payload is invalid.");
      return;
    }

    const roomCode = asTrimmedString(payload.roomCode)?.toUpperCase();
    const hostKey = asTrimmedString(payload.hostKey);
    const gameType = payload.gameType;
    if (
      !roomCode ||
      !hostKey ||
      (gameType !== "GUESS_CAR" && gameType !== "IMPOSTER")
    ) {
      this.emitError(socket, "INVALID_GAME_SELECT", "Game selection payload is invalid.");
      return;
    }

    const room = this.requireHostRoom(socket, roomCode, hostKey);
    if (!room) {
      return;
    }

    if (room.status !== "LOBBY") {
      this.emitError(socket, "GAME_ALREADY_RUNNING", "Game can only be selected in the lobby.");
      return;
    }

    this.roomManager.setGameType(room, gameType);
    this.broadcastRoomUpdate(room);
  }

  public handleGameStart(socket: TypedSocket, payload: unknown): void {
    if (
      !isRecord(payload) ||
      !hasStringField(payload, "roomCode", { maxLength: 8 }) ||
      !hasStringField(payload, "hostKey", { maxLength: 96 })
    ) {
      this.emitError(socket, "INVALID_GAME_START", "Game start payload is invalid.");
      return;
    }

    const roomCode = asTrimmedString(payload.roomCode)?.toUpperCase();
    const hostKey = asTrimmedString(payload.hostKey);
    if (!roomCode || !hostKey) {
      this.emitError(socket, "INVALID_GAME_START", "Game start payload is invalid.");
      return;
    }

    const room = this.requireHostRoom(socket, roomCode, hostKey);
    if (!room) {
      return;
    }

    if (room.gameType === "NONE") {
      this.emitError(socket, "GAME_NOT_SELECTED", "Host must select a game first.");
      return;
    }

    if (room.status !== "LOBBY") {
      this.emitError(socket, "GAME_ALREADY_RUNNING", "Game has already started.");
      return;
    }

    if (room.gameType === "IMPOSTER" && room.players.length < MIN_PLAYERS_IMPOSTER) {
      this.emitError(
        socket,
        "NOT_ENOUGH_PLAYERS",
        `Imposter requires at least ${MIN_PLAYERS_IMPOSTER} players.`,
      );
      return;
    }

    this.roomManager.startGame(room);
    this.broadcastRoomUpdate(room);
    this.startNextRound(room);
  }

  public handleGameNext(socket: TypedSocket, payload: unknown): void {
    if (
      !isRecord(payload) ||
      !hasStringField(payload, "roomCode", { maxLength: 8 }) ||
      !hasStringField(payload, "hostKey", { maxLength: 96 })
    ) {
      this.emitError(socket, "INVALID_GAME_NEXT", "Game next payload is invalid.");
      return;
    }

    const roomCode = asTrimmedString(payload.roomCode)?.toUpperCase();
    const hostKey = asTrimmedString(payload.hostKey);
    if (!roomCode || !hostKey) {
      this.emitError(socket, "INVALID_GAME_NEXT", "Game next payload is invalid.");
      return;
    }

    const room = this.requireHostRoom(socket, roomCode, hostKey);
    if (!room) {
      return;
    }

    const activeRound = room.activeRound;
    if (!activeRound?.nextRoundTimer) {
      this.emitError(socket, "NEXT_NOT_AVAILABLE", "Next round is not waiting in intermission.");
      return;
    }

    clearTimeout(activeRound.nextRoundTimer);
    activeRound.nextRoundTimer = undefined;
    activeRound.nextRoundStartsAt = undefined;
    this.startNextRound(room);
  }

  public handleGuessSubmit(socket: TypedSocket, payload: unknown): void {
    if (
      !isRecord(payload) ||
      !hasStringField(payload, "roomCode", { maxLength: 8 }) ||
      !hasStringField(payload, "playerToken", { maxLength: 96 }) ||
      !hasNumberField(payload, "round") ||
      !hasStringField(payload, "optionId", { maxLength: 64 }) ||
      !hasNumberField(payload, "clientTime")
    ) {
      this.emitError(socket, "INVALID_GUESS_SUBMIT", "Guess submit payload is invalid.");
      return;
    }

    const roomCode = asTrimmedString(payload.roomCode)?.toUpperCase();
    const playerToken = asTrimmedString(payload.playerToken);
    const optionId = asTrimmedString(payload.optionId);
    if (!roomCode || !playerToken || !optionId) {
      this.emitError(socket, "INVALID_GUESS_SUBMIT", "Guess submit payload is invalid.");
      return;
    }

    const room = this.roomManager.getRoom(roomCode);
    if (!room) {
      this.emitError(socket, "ROOM_NOT_FOUND", "Room not found.");
      return;
    }

    const player = this.roomManager.getPlayerByToken(room, playerToken);
    if (!player) {
      this.emitError(socket, "PLAYER_NOT_FOUND", "Player token is invalid.");
      return;
    }

    if (!room.activeRound || room.activeRound.kind !== "GUESS_CAR") {
      this.emitError(socket, "ROUND_NOT_ACTIVE", "Guess Car round is not active.");
      return;
    }

    if (room.activeRound.round !== payload.round) {
      this.emitError(socket, "ROUND_MISMATCH", "Guess was submitted for the wrong round.");
      return;
    }

    const currentAttempts = room.activeRound.guessAttemptsByPlayerId.get(player.id) ?? 0;
    if (currentAttempts >= RATE_LIMIT_MAX_GUESS_SUBMITS_PER_ROUND) {
      this.emitError(socket, "GUESS_RATE_LIMIT", "Too many guess submissions for this round.");
      return;
    }

    room.activeRound.guessAttemptsByPlayerId.set(player.id, currentAttempts + 1);

    if (room.activeRound.answeredPlayerIds.has(player.id)) {
      this.emitError(socket, "ALREADY_ANSWERED", "You already answered this round.");
      return;
    }

    room.activeRound.answeredPlayerIds.add(player.id);
    const submittedAt = Date.now();
    room.activeRound.submissionsByPlayerId.set(player.id, {
      optionId,
      submittedAt,
      isCorrect: optionId === room.activeRound.correctOptionId,
    });

    if (room.activeRound.answeredPlayerIds.size >= room.players.length) {
      this.finishGuessRound(room);
      return;
    }
  }

  public handleDisconnect(socket: TypedSocket): void {
    const disconnected = this.roomManager.handleDisconnect(socket.id);
    if (!disconnected.room || !disconnected.player) {
      return;
    }

    const room = disconnected.room;
    const player = disconnected.player;

    if (this.roomManager.countConnectedPlayers(room) === 0) {
      this.roomManager.scheduleCleanup(room, () => {
        this.roomManager.deleteRoom(room.roomCode);
      });
    }

    if (room.hostId === player.id) {
      this.roomManager.scheduleHostReconnect(room, () => {
        const currentRoom = this.roomManager.getRoom(room.roomCode);
        if (!currentRoom) {
          return;
        }

        const hostStillConnected = currentRoom.players.find(
          (candidate) => candidate.id === currentRoom.hostId && candidate.connected,
        );
        if (hostStillConnected) {
          return;
        }

        const nextHost = this.roomManager.pickHost(currentRoom, true);
        if (nextHost) {
          currentRoom.hostId = nextHost.id;
          currentRoom.hostKey = createSecret();
          this.sendHostCredentialsIfNeeded(currentRoom, nextHost);
          this.broadcastRoomUpdate(currentRoom);
        }
      });
    }

    this.broadcastRoomUpdate(room);
  }

  public consumeRateLimit(socket: TypedSocket): boolean {
    const now = Date.now();
    const existing = this.rateLimits.get(socket.id);

    if (!existing || existing.resetAt <= now) {
      this.rateLimits.set(socket.id, {
        count: 1,
        resetAt: now + RATE_LIMIT_WINDOW_MS,
      });
      return true;
    }

    if (existing.count >= RATE_LIMIT_MAX_COMMANDS) {
      this.emitError(socket, "RATE_LIMITED", "Too many commands. Slow down.");
      return false;
    }

    existing.count += 1;
    return true;
  }

  private requireHostRoom(
    socket: TypedSocket,
    roomCode: string,
    hostKey: string,
  ): InternalRoom | undefined {
    const room = this.roomManager.getRoom(roomCode);
    if (!room) {
      this.emitError(socket, "ROOM_NOT_FOUND", "Room not found.");
      return undefined;
    }

    if (!this.roomManager.isHost(room, hostKey)) {
      this.emitError(socket, "NOT_HOST", "Host key is invalid.");
      return undefined;
    }

    return room;
  }

  private startNextRound(room: InternalRoom): void {
    if (room.status !== "PLAYING") {
      return;
    }

    const roundNumber = room.round + 1;
    if (roundNumber > TOTAL_QUESTIONS) {
      return;
    }

    if (room.gameType === "GUESS_CAR") {
      this.startGuessRound(room, roundNumber);
      return;
    }

    this.startImposterRound(room, roundNumber);
  }

  private startGuessRound(room: InternalRoom, roundNumber: number): void {
    const now = Date.now();
    const roundEndsAt = now + ROUND_MAX_MS;
    const question = buildGuessQuestion(room);
    const activeRound: GuessCarActiveRound = {
      kind: "GUESS_CAR",
      round: roundNumber,
      startedAt: now,
      endsAt: roundEndsAt,
      startedPayload: question.startedPayload,
      correctOptionId: question.correctOptionId,
      answeredPlayerIds: new Set<string>(),
      submissionsByPlayerId: new Map(),
      guessAttemptsByPlayerId: new Map<string, number>(),
    };

    activeRound.timeout = setTimeout(() => {
      const currentRoom = this.roomManager.getRoom(room.roomCode);
      if (!currentRoom?.activeRound || currentRoom.activeRound.kind !== "GUESS_CAR") {
        return;
      }

      this.finishGuessRound(currentRoom);
    }, ROUND_MAX_MS);

    this.roomManager.setActiveRound(room, activeRound);
    this.broadcastRoomUpdate(room);

    const payload: GameStartedPayload = {
      gameType: "GUESS_CAR",
      round: roundNumber,
      roundEndsAt,
      payload: question.startedPayload,
    };

    if (roundNumber === 1) {
      this.io.to(room.roomCode).emit(EVENTS.S2C.GAME_STARTED, payload);
      return;
    }

    const roundPayload: RoundStartedPayload = {
      round: roundNumber,
      roundEndsAt,
      payload: question.startedPayload,
    };
    this.io.to(room.roomCode).emit(EVENTS.S2C.ROUND_STARTED, roundPayload);
  }

  private finishGuessRound(room: InternalRoom): void {
    const activeRound = room.activeRound;
    if (!activeRound || activeRound.kind !== "GUESS_CAR") {
      return;
    }

    if (activeRound.timeout) {
      clearTimeout(activeRound.timeout);
      activeRound.timeout = undefined;
    }

    const round = activeRound.round;
    const sortedCorrectSubmissions = [...activeRound.submissionsByPlayerId.entries()]
      .filter(([, submission]) => submission.isCorrect)
      .sort((left, right) => left[1].submittedAt - right[1].submittedAt);

    const awardPoints = (rank: number): number => {
      if (rank === 1) {
        return 4;
      }
      if (rank === 2) {
        return 3;
      }
      if (rank === 3) {
        return 2;
      }
      return 1;
    };

    const standings = room.players
      .map((player) => {
        const submission = activeRound.submissionsByPlayerId.get(player.id);
        const answerRank = submission?.isCorrect
          ? sortedCorrectSubmissions.findIndex(([playerId]) => playerId === player.id) + 1
          : undefined;
        const roundPoints = answerRank ? awardPoints(answerRank) : 0;
        const totalPoints = (room.guessScoreByPlayerId.get(player.id) ?? 0) + roundPoints;
        room.guessScoreByPlayerId.set(player.id, totalPoints);

        return {
          playerId: player.id,
          nickname: player.nickname,
          roundPoints,
          totalPoints,
          answered: Boolean(submission),
          isCorrect: Boolean(submission?.isCorrect),
          answerRank,
        };
      })
      .sort((left, right) => {
        if (right.totalPoints !== left.totalPoints) {
          return right.totalPoints - left.totalPoints;
        }

        return left.nickname.localeCompare(right.nickname);
      });

    const winner = standings.find((entry) => entry.answerRank === 1);
    this.roomManager.clearActiveRound(room);
    const results: RoundEndedPayload["results"] = {
      correctOptionId: activeRound.correctOptionId,
      allAnswered: activeRound.answeredPlayerIds.size >= room.players.length,
      winnerPlayerId: winner?.playerId,
      winnerNickname: winner?.nickname,
      answeredCount: activeRound.answeredPlayerIds.size,
      standings,
    };
    const winnerNickname = winner?.nickname;
    this.roomManager.addRoundWinner(room, round, winnerNickname);

    const endedAt = Date.now();
    if (round >= TOTAL_QUESTIONS) {
      const roomClosesAt = endedAt + ROOM_CLOSE_AFTER_GAME_MS;
      this.roomManager.setClosing(room, roomClosesAt);

      const roundEndedPayload: RoundEndedPayload = {
        round,
        results,
        gameEndsAt: endedAt,
        roomClosesAt,
      };
      this.io.to(room.roomCode).emit(EVENTS.S2C.ROUND_ENDED, roundEndedPayload);
      this.finishGame(room, roomClosesAt);
      return;
    }

    activeRound.nextRoundStartsAt = endedAt + INTERMISSION_MS;
    activeRound.nextRoundTimer = setTimeout(() => {
      const currentRoom = this.roomManager.getRoom(room.roomCode);
      if (!currentRoom) {
        return;
      }

      this.startNextRound(currentRoom);
    }, INTERMISSION_MS);
    room.activeRound = activeRound;

    const roundEndedPayload: RoundEndedPayload = {
      round,
      results,
      nextRoundStartsAt: activeRound.nextRoundStartsAt,
    };
    this.io.to(room.roomCode).emit(EVENTS.S2C.ROUND_ENDED, roundEndedPayload);
    this.broadcastRoomUpdate(room);
  }

  private startImposterRound(room: InternalRoom, roundNumber: number): void {
    const now = Date.now();
    const roundEndsAt = now + ROUND_MAX_MS;
    const { normalCar, imposterCar } = buildImposterImages();
    const imposterPlayer = shuffle(room.players)[0];
    const activeRound: ImposterActiveRound = {
      kind: "IMPOSTER",
      round: roundNumber,
      startedAt: now,
      endsAt: roundEndsAt,
      imposterPlayerId: imposterPlayer.id,
      normalCarImageUrl: normalCar.carImageUrl,
      imposterCarImageUrl: imposterCar.carImageUrl,
      prompt: "Call outside the app and discuss who is the imposter.",
    };

    activeRound.timeout = setTimeout(() => {
      const currentRoom = this.roomManager.getRoom(room.roomCode);
      if (!currentRoom?.activeRound || currentRoom.activeRound.kind !== "IMPOSTER") {
        return;
      }

      this.finishImposterRound(currentRoom);
    }, ROUND_MAX_MS);

    this.roomManager.setActiveRound(room, activeRound);
    this.broadcastRoomUpdate(room);

    for (const player of room.players) {
      if (!player.socketId) {
        continue;
      }

      const payload = this.createImposterStartedPayload(activeRound, player.id);
      if (roundNumber === 1) {
        const gameStartedPayload: GameStartedPayload = {
          gameType: "IMPOSTER",
          round: roundNumber,
          roundEndsAt,
          payload,
        };
        this.io.to(player.socketId).emit(EVENTS.S2C.GAME_STARTED, gameStartedPayload);
      } else {
        const roundStartedPayload: RoundStartedPayload = {
          round: roundNumber,
          roundEndsAt,
          payload,
        };
        this.io.to(player.socketId).emit(EVENTS.S2C.ROUND_STARTED, roundStartedPayload);
      }
    }
  }

  private finishImposterRound(room: InternalRoom): void {
    const activeRound = room.activeRound;
    if (!activeRound || activeRound.kind !== "IMPOSTER") {
      return;
    }

    if (activeRound.timeout) {
      clearTimeout(activeRound.timeout);
      activeRound.timeout = undefined;
    }

    const imposter = room.players.find(
      (player) => player.id === activeRound.imposterPlayerId,
    );
    const round = activeRound.round;
    this.roomManager.clearActiveRound(room);
    this.roomManager.addRoundWinner(room, round);

    const results = {
      imposterPlayerId: activeRound.imposterPlayerId,
      imposterNickname: imposter?.nickname ?? "Unknown",
      normalCarImageUrl: activeRound.normalCarImageUrl,
      imposterCarImageUrl: activeRound.imposterCarImageUrl,
    };

    const endedAt = Date.now();
    if (round >= TOTAL_QUESTIONS) {
      const roomClosesAt = endedAt + ROOM_CLOSE_AFTER_GAME_MS;
      this.roomManager.setClosing(room, roomClosesAt);

      const roundEndedPayload: RoundEndedPayload = {
        round,
        results,
        gameEndsAt: endedAt,
        roomClosesAt,
      };
      this.io.to(room.roomCode).emit(EVENTS.S2C.ROUND_ENDED, roundEndedPayload);
      this.finishGame(room, roomClosesAt);
      return;
    }

    activeRound.nextRoundStartsAt = endedAt + INTERMISSION_MS;
    activeRound.nextRoundTimer = setTimeout(() => {
      const currentRoom = this.roomManager.getRoom(room.roomCode);
      if (!currentRoom) {
        return;
      }

      this.startNextRound(currentRoom);
    }, INTERMISSION_MS);
    room.activeRound = activeRound;

    const roundEndedPayload: RoundEndedPayload = {
      round,
      results,
      nextRoundStartsAt: activeRound.nextRoundStartsAt,
    };
    this.io.to(room.roomCode).emit(EVENTS.S2C.ROUND_ENDED, roundEndedPayload);
    this.broadcastRoomUpdate(room);
  }

  private finishGame(room: InternalRoom, roomClosesAt: number): void {
    const gameEndedPayload: GameEndedPayload = {
      results: {
        rounds: room.roundResults,
        standings:
          room.gameType === "GUESS_CAR"
            ? room.players
                .map((player) => ({
                  playerId: player.id,
                  nickname: player.nickname,
                  totalPoints: room.guessScoreByPlayerId.get(player.id) ?? 0,
                }))
                .sort((left, right) => right.totalPoints - left.totalPoints)
            : undefined,
      },
      roomClosesAt,
    };
    room.gameEndedPayload = gameEndedPayload;
    this.io.to(room.roomCode).emit(EVENTS.S2C.GAME_ENDED, gameEndedPayload);
    this.broadcastRoomUpdate(room);

    room.roomCloseTimer = setTimeout(() => {
      this.io.to(room.roomCode).emit(EVENTS.S2C.ROOM_CLOSED, {
        reason: "GAME_FINISHED",
      });
      this.roomManager.deleteRoom(room.roomCode);
    }, ROOM_CLOSE_AFTER_GAME_MS);
  }

  private emitLiveStateToPlayer(
    socket: TypedSocket,
    room: InternalRoom,
    player: InternalPlayer,
  ): void {
    if (room.status === "CLOSING" && room.gameEndedPayload) {
      socket.emit(EVENTS.S2C.GAME_ENDED, room.gameEndedPayload);
      return;
    }

    const activeRound = room.activeRound;
    if (!activeRound || activeRound.nextRoundTimer) {
      return;
    }

    if (activeRound.kind === "GUESS_CAR") {
      const payload: RoundStartedPayload = {
        round: activeRound.round,
        roundEndsAt: activeRound.endsAt,
        payload: activeRound.startedPayload,
      };
      socket.emit(EVENTS.S2C.ROUND_STARTED, payload);
      return;
    }

    const payload: RoundStartedPayload = {
      round: activeRound.round,
      roundEndsAt: activeRound.endsAt,
      payload: this.createImposterStartedPayload(activeRound, player.id),
    };
    socket.emit(EVENTS.S2C.ROUND_STARTED, payload);
  }

  private createImposterStartedPayload(
    activeRound: ImposterActiveRound,
    playerId: string,
  ): ImposterRoundStartedPayload {
    return {
      imageUrl:
        playerId === activeRound.imposterPlayerId
          ? activeRound.imposterCarImageUrl
          : activeRound.normalCarImageUrl,
      prompt: activeRound.prompt,
    };
  }

  private broadcastRoomUpdate(room: InternalRoom): void {
    this.io.to(room.roomCode).emit(EVENTS.S2C.ROOM_UPDATED, {
      roomState: this.roomManager.toPublicRoomState(room),
    });
  }

  private sendHostCredentialsIfNeeded(
    room: InternalRoom,
    player: InternalPlayer | undefined,
  ): void {
    if (!player?.socketId || room.hostId !== player.id) {
      return;
    }

    this.io.to(player.socketId).emit(EVENTS.S2C.ROOM_CREATED, {
      roomState: this.roomManager.toPublicRoomState(room),
      playerToken: player.playerToken,
      hostKey: room.hostKey,
    });
  }

  private emitError(socket: TypedSocket, code: string, message: string): void {
    const payload: ErrorPayload = { code, message };
    socket.emit(EVENTS.S2C.ERROR, payload);
  }
}
