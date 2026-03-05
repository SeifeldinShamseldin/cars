import { getReadOnlySqliteDb, getWritableSqliteDb } from "../../data/sqliteDb";
import { createId } from "../../utils/id";
import type { GameType, RoomStatus } from "../../../shared/types/domain";
import type { AdminRoomMonitorSnapshot, InternalPlayer, InternalRoom } from "../../core/rooms/types";

const ROOM_EVENT_TYPES = [
  "ROOM_CREATED",
  "PLAYER_JOINED",
  "PLAYER_LEFT",
  "PLAYER_RECONNECTED",
  "PLAYER_DISCONNECTED",
  "HOST_REASSIGNED",
  "GAME_SELECTED",
  "GAME_STARTED",
  "ROOM_CLOSING",
  "ROOM_RETURNED_TO_LOBBY",
  "ROOM_CLEANUP_SCHEDULED",
  "ROOM_CLOSED",
  "ROOM_DELETED",
] as const;

export type RoomEventType = (typeof ROOM_EVENT_TYPES)[number];

export type RoomAuditEvent = {
  id: string;
  roomCode: string;
  eventType: RoomEventType;
  roomStatus?: RoomStatus;
  gameType?: GameType;
  playerCount: number;
  connectedCount: number;
  hostId?: string;
  playerId?: string;
  playerName?: string;
  reason?: string;
  details?: Record<string, unknown>;
  players: Array<{
    id: string;
    nickname: string;
    connected: boolean;
    isHost: boolean;
  }>;
  createdAt: string;
};

export type AdminRoomsDashboard = {
  live: AdminRoomMonitorSnapshot;
  recentEvents: RoomAuditEvent[];
};

let schemaEnsured = false;

export const ensureRoomAuditSchema = (): void => {
  if (schemaEnsured) {
    return;
  }

  const db = getWritableSqliteDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS room_events (
      id TEXT PRIMARY KEY,
      room_code TEXT NOT NULL,
      event_type TEXT NOT NULL,
      room_status TEXT,
      game_type TEXT,
      player_count INTEGER NOT NULL,
      connected_count INTEGER NOT NULL,
      host_id TEXT,
      player_id TEXT,
      player_name TEXT,
      reason TEXT,
      details_json TEXT,
      players_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_room_events_room_code
    ON room_events (room_code);

    CREATE INDEX IF NOT EXISTS idx_room_events_event_type
    ON room_events (event_type);

    CREATE INDEX IF NOT EXISTS idx_room_events_created_at
    ON room_events (created_at DESC);
  `);

  schemaEnsured = true;
};

const serializePlayers = (room: InternalRoom): string =>
  JSON.stringify(
    room.players
      .map((player) => ({
        id: player.id,
        nickname: player.nickname,
        connected: player.connected,
        isHost: player.id === room.hostId,
      }))
      .sort((left, right) => left.nickname.localeCompare(right.nickname)),
  );

export const recordRoomAuditEvent = ({
  room,
  eventType,
  player,
  reason,
  details,
}: {
  room: InternalRoom;
  eventType: RoomEventType;
  player?: InternalPlayer;
  reason?: string;
  details?: Record<string, unknown>;
}): void => {
  ensureRoomAuditSchema();

  const db = getWritableSqliteDb();
  const connectedCount = room.players.filter((candidate) => candidate.connected).length;
  db.prepare(`
    INSERT INTO room_events (
      id,
      room_code,
      event_type,
      room_status,
      game_type,
      player_count,
      connected_count,
      host_id,
      player_id,
      player_name,
      reason,
      details_json,
      players_json,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    createId(),
    room.roomCode,
    eventType,
    room.status,
    room.gameType,
    room.players.length,
    connectedCount,
    room.hostId,
    player?.id ?? null,
    player?.nickname ?? null,
    reason ?? null,
    details ? JSON.stringify(details) : null,
    serializePlayers(room),
    new Date().toISOString(),
  );
};

export const getRecentRoomAuditEvents = (limit = 120): RoomAuditEvent[] => {
  ensureRoomAuditSchema();

  const db = getReadOnlySqliteDb();
  const rows = db.prepare(`
    SELECT
      id,
      room_code,
      event_type,
      room_status,
      game_type,
      player_count,
      connected_count,
      host_id,
      player_id,
      player_name,
      reason,
      details_json,
      players_json,
      created_at
    FROM room_events
    ORDER BY created_at DESC
    LIMIT ?
  `).all(limit) as Array<Record<string, unknown>>;

  return rows.map((row) => ({
    id: String(row.id),
    roomCode: String(row.room_code),
    eventType: row.event_type as RoomEventType,
    roomStatus: typeof row.room_status === "string" ? (row.room_status as RoomStatus) : undefined,
    gameType: typeof row.game_type === "string" ? (row.game_type as GameType) : undefined,
    playerCount: Number(row.player_count ?? 0),
    connectedCount: Number(row.connected_count ?? 0),
    hostId: typeof row.host_id === "string" ? row.host_id : undefined,
    playerId: typeof row.player_id === "string" ? row.player_id : undefined,
    playerName: typeof row.player_name === "string" ? row.player_name : undefined,
    reason: typeof row.reason === "string" ? row.reason : undefined,
    details:
      typeof row.details_json === "string" && row.details_json.length > 0
        ? (JSON.parse(row.details_json) as Record<string, unknown>)
        : undefined,
    players:
      typeof row.players_json === "string"
        ? (JSON.parse(row.players_json) as RoomAuditEvent["players"])
        : [],
    createdAt: String(row.created_at),
  }));
};
