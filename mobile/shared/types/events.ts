/**
 * @fileoverview Socket event name constants (single source of truth).
 * Use the same file in both frontend and backend to avoid drift.
 */

export const EVENTS = {
  C2S: {
    ROOM_CREATE: "room.create",
    ROOM_JOIN: "room.join",
    ROOM_LEAVE: "room.leave",
    ROOM_SYNC: "room.sync",
    GAME_SELECT: "game.select",
    GAME_START: "game.start",
    GAME_EXIT: "game.exit",
    GAME_REMATCH: "game.rematch",
    GAME_NEXT: "game.next",
    GUESS_SUBMIT: "guess.submit",
  },
  S2C: {
    ROOM_CREATED: "room.created",
    ROOM_JOINED: "room.joined",
    ROOM_STATE: "room.state",
    ROOM_UPDATED: "room.updated",
    ROOM_CLOSED: "room.closed",
    CATALOG_REFRESH: "catalog.refresh",
    GAME_STARTED: "game.started",
    ROUND_STARTED: "round.started",
    ROUND_ENDED: "round.ended",
    GAME_ENDED: "game.ended",
    ERROR: "error",
  },
} as const;

export type C2SEventName = (typeof EVENTS.C2S)[keyof typeof EVENTS.C2S];
export type S2CEventName = (typeof EVENTS.S2C)[keyof typeof EVENTS.S2C];
export type AnyEventName = C2SEventName | S2CEventName;
