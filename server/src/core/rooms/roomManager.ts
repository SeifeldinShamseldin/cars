import type { GameType, RoomStatePublic } from "../../../shared/types/domain";
import {
  EMPTY_ROOM_TTL_MS,
  HOST_RECONNECT_GRACE_MS,
} from "../../config/constants";
import { createId, createRoomCode, createSecret } from "../../utils/id";
import type {
  ActiveRound,
  AdminRoomMonitorSnapshot,
  AdminRoomSnapshot,
  InternalPlayer,
  InternalRoom,
  PlayerLookup,
} from "./types";

export class RoomManager {
  private readonly rooms = new Map<string, InternalRoom>();

  private readonly socketToPlayer = new Map<
    string,
    { roomCode: string; playerId: string }
  >();

  public createRoom(
    nickname: string,
    socketId: string,
    gameType: GameType = "NONE",
  ): {
    room: InternalRoom;
    player: InternalPlayer;
    hostKey: string;
  } {
    const now = Date.now();
    const player: InternalPlayer = {
      id: createId(),
      nickname,
      joinedAt: now,
      playerToken: createSecret(),
      socketId,
      connected: true,
    };

    let roomCode = createRoomCode();
    while (this.rooms.has(roomCode)) {
      roomCode = createRoomCode();
    }

    const room: InternalRoom = {
      roomCode,
      hostId: player.id,
      hostKey: createSecret(),
      players: [player],
      gameType,
      status: "LOBBY",
      round: 0,
      version: 1,
      createdAt: now,
      updatedAt: now,
      roundResults: [],
      guessScoreByPlayerId: new Map<string, number>(),
      usedQuestionIds: new Set<string>(),
    };

    this.rooms.set(roomCode, room);
    this.socketToPlayer.set(socketId, { roomCode, playerId: player.id });
    return { room, player, hostKey: room.hostKey };
  }

  public joinRoom(
    roomCode: string,
    nickname: string,
    socketId: string,
  ): { room: InternalRoom; player: InternalPlayer } | undefined {
    const room = this.rooms.get(roomCode);
    if (!room) {
      return undefined;
    }

    const now = Date.now();
    const player: InternalPlayer = {
      id: createId(),
      nickname,
      joinedAt: now,
      playerToken: createSecret(),
      socketId,
      connected: true,
    };

    room.players.push(player);
    this.touchRoom(room);
    this.cancelCleanup(room);
    this.socketToPlayer.set(socketId, { roomCode, playerId: player.id });
    return { room, player };
  }

  public syncPlayer(
    roomCode: string,
    playerToken: string,
    socketId: string,
  ): PlayerLookup | undefined {
    const room = this.rooms.get(roomCode);
    if (!room) {
      return undefined;
    }

    const player = room.players.find((candidate) => candidate.playerToken === playerToken);
    if (!player) {
      return undefined;
    }

    if (player.socketId) {
      this.socketToPlayer.delete(player.socketId);
    }

    player.socketId = socketId;
    player.connected = true;
    player.disconnectedAt = undefined;
    this.socketToPlayer.set(socketId, { roomCode, playerId: player.id });
    this.cancelCleanup(room);

    if (room.hostId === player.id) {
      this.cancelHostReconnect(room);
    }

    if (!room.players.some((candidate) => candidate.id === room.hostId)) {
      const nextHost = this.pickHost(room, false);
      if (nextHost) {
        room.hostId = nextHost.id;
        room.hostKey = createSecret();
      }
    }

    this.touchRoom(room);
    return { room, player };
  }

  public removePlayer(
    roomCode: string,
    playerToken: string,
  ): { room?: InternalRoom; removedPlayer?: InternalPlayer } {
    const room = this.rooms.get(roomCode);
    if (!room) {
      return {};
    }

    const playerIndex = room.players.findIndex(
      (candidate) => candidate.playerToken === playerToken,
    );
    if (playerIndex === -1) {
      return { room };
    }

    const [removedPlayer] = room.players.splice(playerIndex, 1);
    if (removedPlayer.socketId) {
      this.socketToPlayer.delete(removedPlayer.socketId);
    }

    if (room.hostId === removedPlayer.id) {
      const nextHost = this.pickHost(room, false);
      if (nextHost) {
        room.hostId = nextHost.id;
        room.hostKey = createSecret();
      }
    }

    this.touchRoom(room);
    return { room, removedPlayer };
  }

  public handleDisconnect(
    socketId: string,
  ): { room?: InternalRoom; player?: InternalPlayer } {
    const lookup = this.socketToPlayer.get(socketId);
    if (!lookup) {
      return {};
    }

    const room = this.rooms.get(lookup.roomCode);
    this.socketToPlayer.delete(socketId);
    if (!room) {
      return {};
    }

    const player = room.players.find((candidate) => candidate.id === lookup.playerId);
    if (!player) {
      return { room };
    }

    player.connected = false;
    player.socketId = undefined;
    player.disconnectedAt = Date.now();
    this.touchRoom(room);
    return { room, player };
  }

  public getRoom(roomCode: string): InternalRoom | undefined {
    return this.rooms.get(roomCode);
  }

  public getSocketBinding(socketId: string):
    | { roomCode: string; playerId: string }
    | undefined {
    return this.socketToPlayer.get(socketId);
  }

  public getPlayerByToken(
    room: InternalRoom,
    playerToken: string,
  ): InternalPlayer | undefined {
    return room.players.find((candidate) => candidate.playerToken === playerToken);
  }

  public isHost(room: InternalRoom, hostKey: string): boolean {
    return room.hostKey === hostKey;
  }

  public setGameType(room: InternalRoom, gameType: GameType): void {
    room.gameType = gameType;
    this.touchRoom(room);
  }

  public startGame(room: InternalRoom): void {
    room.status = "PLAYING";
    room.round = 0;
    room.roundEndsAt = undefined;
    room.roomClosesAt = undefined;
    room.activeRound = undefined;
    room.roundResults = [];
    room.guessScoreByPlayerId = new Map<string, number>();
    room.usedQuestionIds = new Set<string>();
    room.gameEndedPayload = undefined;
    this.touchRoom(room);
  }

  public setClosing(room: InternalRoom, roomClosesAt: number): void {
    room.status = "CLOSING";
    room.roundEndsAt = undefined;
    room.roomClosesAt = roomClosesAt;
    this.touchRoom(room);
  }

  public setLobby(room: InternalRoom, gameType: GameType = "NONE"): void {
    room.status = "LOBBY";
    room.gameType = gameType;
    room.round = 0;
    room.roundEndsAt = undefined;
    room.activeRound = undefined;
    room.roomClosesAt = undefined;
    room.gameEndedPayload = undefined;
    this.touchRoom(room);
  }

  public setActiveRound(room: InternalRoom, activeRound: ActiveRound): void {
    room.activeRound = activeRound;
    room.round = activeRound.round;
    room.roundEndsAt = activeRound.endsAt;
    this.touchRoom(room);
  }

  public clearActiveRound(room: InternalRoom): void {
    room.activeRound = undefined;
    room.roundEndsAt = undefined;
    this.touchRoom(room);
  }

  public addRoundWinner(
    room: InternalRoom,
    round: number,
    winnerNickname?: string,
  ): void {
    room.roundResults.push({ round, winnerNickname });
    this.touchRoom(room);
  }

  public toPublicRoomState(room: InternalRoom): RoomStatePublic {
    return {
      roomCode: room.roomCode,
      hostId: room.hostId,
      players: room.players.map(({ id, nickname, joinedAt }) => ({
        id,
        nickname,
        joinedAt,
      })),
      gameType: room.gameType,
      status: room.status,
      round: room.round,
      roundEndsAt: room.roundEndsAt,
      version: room.version,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    };
  }

  public countConnectedPlayers(room: InternalRoom): number {
    return room.players.filter((player) => player.connected).length;
  }

  public getAdminMonitorSnapshot(now = Date.now()): AdminRoomMonitorSnapshot {
    const rooms = [...this.rooms.values()]
      .map((room) => this.toAdminRoomSnapshot(room, now))
      .sort((left, right) => right.updatedAt - left.updatedAt);

    return {
      activeRoomCount: rooms.length,
      totalPlayerCount: rooms.reduce((sum, room) => sum + room.playerCount, 0),
      connectedPlayerCount: rooms.reduce((sum, room) => sum + room.connectedCount, 0),
      rooms,
    };
  }

  public pickHost(
    room: InternalRoom,
    connectedOnly: boolean,
  ): InternalPlayer | undefined {
    return room.players
      .filter((player) => (connectedOnly ? player.connected : true))
      .sort((left, right) => left.joinedAt - right.joinedAt)[0];
  }

  public scheduleCleanup(room: InternalRoom, onExpire: () => void): void {
    this.scheduleCleanupWithTtl(room, EMPTY_ROOM_TTL_MS, onExpire);
  }

  public scheduleCleanupWithTtl(
    room: InternalRoom,
    ttlMs: number,
    onExpire: () => void,
  ): void {
    this.cancelCleanup(room);

    if (Number(ttlMs) === 0) {
      onExpire();
      return;
    }

    room.cleanupExpiresAt = Date.now() + ttlMs;
    room.cleanupTimer = setTimeout(onExpire, ttlMs);
  }

  public cancelCleanup(room: InternalRoom): void {
    if (room.cleanupTimer) {
      clearTimeout(room.cleanupTimer);
      room.cleanupTimer = undefined;
    }
    room.cleanupExpiresAt = undefined;
  }

  public scheduleHostReconnect(room: InternalRoom, onExpire: () => void): void {
    this.cancelHostReconnect(room);
    room.hostReconnectExpiresAt = Date.now() + HOST_RECONNECT_GRACE_MS;
    room.hostReconnectTimer = setTimeout(onExpire, HOST_RECONNECT_GRACE_MS);
  }

  public cancelHostReconnect(room: InternalRoom): void {
    if (room.hostReconnectTimer) {
      clearTimeout(room.hostReconnectTimer);
      room.hostReconnectTimer = undefined;
    }
    room.hostReconnectExpiresAt = undefined;
  }

  public scheduleRoomClose(
    room: InternalRoom,
    roomClosesAt: number,
    onExpire: () => void,
  ): void {
    this.cancelRoomClose(room);
    room.roomCloseExpiresAt = roomClosesAt;
    room.roomCloseTimer = setTimeout(onExpire, Math.max(roomClosesAt - Date.now(), 0));
  }

  public cancelRoomClose(room: InternalRoom): void {
    if (room.roomCloseTimer) {
      clearTimeout(room.roomCloseTimer);
      room.roomCloseTimer = undefined;
    }
    room.roomCloseExpiresAt = undefined;
  }

  public deleteRoom(roomCode: string): void {
    const room = this.rooms.get(roomCode);
    if (!room) {
      return;
    }

    this.clearTimers(room);

    for (const player of room.players) {
      if (player.socketId) {
        this.socketToPlayer.delete(player.socketId);
      }
    }

    this.rooms.delete(roomCode);
  }

  public clearTimers(room: InternalRoom): void {
    this.cancelCleanup(room);
    this.cancelHostReconnect(room);
    this.cancelRoomClose(room);

    if (room.activeRound?.timeout) {
      clearTimeout(room.activeRound.timeout);
      room.activeRound.timeout = undefined;
    }

    if (room.activeRound?.nextRoundTimer) {
      clearTimeout(room.activeRound.nextRoundTimer);
      room.activeRound.nextRoundTimer = undefined;
      room.activeRound.nextRoundStartsAt = undefined;
    }
  }

  private touchRoom(room: InternalRoom): void {
    room.version += 1;
    room.updatedAt = Date.now();
  }

  private toAdminRoomSnapshot(room: InternalRoom, now: number): AdminRoomSnapshot {
    return {
      roomCode: room.roomCode,
      hostId: room.hostId,
      gameType: room.gameType,
      status: room.status,
      round: room.round,
      version: room.version,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      roundEndsAt: room.roundEndsAt,
      roomClosesAt: room.roomClosesAt,
      cleanupExpiresAt:
        room.cleanupExpiresAt && room.cleanupExpiresAt > now ? room.cleanupExpiresAt : undefined,
      hostReconnectExpiresAt:
        room.hostReconnectExpiresAt && room.hostReconnectExpiresAt > now
          ? room.hostReconnectExpiresAt
          : undefined,
      roomCloseExpiresAt:
        room.roomCloseExpiresAt && room.roomCloseExpiresAt > now
          ? room.roomCloseExpiresAt
          : undefined,
      activeRoundKind: room.activeRound?.kind,
      nextRoundStartsAt: room.activeRound?.nextRoundStartsAt,
      playerCount: room.players.length,
      connectedCount: this.countConnectedPlayers(room),
      players: room.players
        .map((player) => ({
          id: player.id,
          nickname: player.nickname,
          joinedAt: player.joinedAt,
          connected: player.connected,
          disconnectedAt: player.disconnectedAt,
          isHost: player.id === room.hostId,
        }))
        .sort((left, right) => left.joinedAt - right.joinedAt),
    };
  }
}
