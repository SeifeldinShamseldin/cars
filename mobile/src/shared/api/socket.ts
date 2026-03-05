import {
  type ClientToServerEvents,
  type GameExitCmd,
  type GameRematchCmd,
  type GameStartCmd,
  type GuessSubmitCmd,
  type RoomCreateCmd,
  type RoomJoinCmd,
  type RoomLeaveCmd,
  type RoomSyncCmd,
  type ServerToClientEvents,
} from "../../../shared/types/domain";
import { EVENTS } from "../../../shared/types/events";
import { io, type Socket } from "socket.io-client";

type ListenerMap = Partial<{
  [EventName in keyof ServerToClientEvents]: ServerToClientEvents[EventName];
} & {
  connect: () => void;
  disconnect: () => void;
}>;

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL ?? "http://localhost:3001";

class AppSocketClient {
  private socket?: Socket<ServerToClientEvents, ClientToServerEvents>;

  private syncProvider?: () => RoomSyncCmd | undefined;

  private isLeavingRoomSession = false;

  public connect(): void {
    const socket = this.getSocket();
    if (!socket.connected) {
      socket.connect();
    }
  }

  public disconnect(): void {
    this.socket?.disconnect();
  }

  public setSyncProvider(syncProvider: () => RoomSyncCmd | undefined): void {
    this.syncProvider = syncProvider;
  }

  public setListeners(listeners: ListenerMap): () => void {
    const socket = this.getSocket();

    const shouldIgnoreRoomSessionEvent = () => this.isLeavingRoomSession;

    const roomCreated = (payload: Parameters<ServerToClientEvents["room.created"]>[0]) => {
      this.isLeavingRoomSession = false;
      listeners[EVENTS.S2C.ROOM_CREATED]?.(payload);
    };
    const roomJoined = (payload: Parameters<ServerToClientEvents["room.joined"]>[0]) => {
      this.isLeavingRoomSession = false;
      listeners[EVENTS.S2C.ROOM_JOINED]?.(payload);
    };
    const roomState = (payload: Parameters<ServerToClientEvents["room.state"]>[0]) => {
      if (shouldIgnoreRoomSessionEvent()) {
        return;
      }

      listeners[EVENTS.S2C.ROOM_STATE]?.(payload);
    };
    const roomUpdated = (payload: Parameters<ServerToClientEvents["room.updated"]>[0]) => {
      if (shouldIgnoreRoomSessionEvent()) {
        return;
      }

      listeners[EVENTS.S2C.ROOM_UPDATED]?.(payload);
    };
    const roomClosed = (payload: Parameters<ServerToClientEvents["room.closed"]>[0]) => {
      if (shouldIgnoreRoomSessionEvent()) {
        return;
      }

      listeners[EVENTS.S2C.ROOM_CLOSED]?.(payload);
    };
    const catalogRefresh = (payload: Parameters<ServerToClientEvents["catalog.refresh"]>[0]) =>
      listeners[EVENTS.S2C.CATALOG_REFRESH]?.(payload);
    const gameStarted = (payload: Parameters<ServerToClientEvents["game.started"]>[0]) => {
      if (shouldIgnoreRoomSessionEvent()) {
        return;
      }

      listeners[EVENTS.S2C.GAME_STARTED]?.(payload);
    };
    const roundStarted = (payload: Parameters<ServerToClientEvents["round.started"]>[0]) => {
      if (shouldIgnoreRoomSessionEvent()) {
        return;
      }

      listeners[EVENTS.S2C.ROUND_STARTED]?.(payload);
    };
    const roundEnded = (payload: Parameters<ServerToClientEvents["round.ended"]>[0]) => {
      if (shouldIgnoreRoomSessionEvent()) {
        return;
      }

      listeners[EVENTS.S2C.ROUND_ENDED]?.(payload);
    };
    const gameEnded = (payload: Parameters<ServerToClientEvents["game.ended"]>[0]) => {
      if (shouldIgnoreRoomSessionEvent()) {
        return;
      }

      listeners[EVENTS.S2C.GAME_ENDED]?.(payload);
    };
    const errored = (payload: Parameters<ServerToClientEvents["error"]>[0]) =>
      listeners[EVENTS.S2C.ERROR]?.(payload);
    const connected = () => {
      listeners.connect?.();
      const syncPayload = this.syncProvider?.();
      if (syncPayload) {
        socket.emit(EVENTS.C2S.ROOM_SYNC, syncPayload);
      }
    };
    const disconnected = () => listeners.disconnect?.();

    socket.off();
    socket.on("connect", connected);
    socket.on("disconnect", disconnected);
    socket.on(EVENTS.S2C.ROOM_CREATED, roomCreated);
    socket.on(EVENTS.S2C.ROOM_JOINED, roomJoined);
    socket.on(EVENTS.S2C.ROOM_STATE, roomState);
    socket.on(EVENTS.S2C.ROOM_UPDATED, roomUpdated);
    socket.on(EVENTS.S2C.ROOM_CLOSED, roomClosed);
    socket.on(EVENTS.S2C.CATALOG_REFRESH, catalogRefresh);
    socket.on(EVENTS.S2C.GAME_STARTED, gameStarted);
    socket.on(EVENTS.S2C.ROUND_STARTED, roundStarted);
    socket.on(EVENTS.S2C.ROUND_ENDED, roundEnded);
    socket.on(EVENTS.S2C.GAME_ENDED, gameEnded);
    socket.on(EVENTS.S2C.ERROR, errored);

    return () => {
      socket.off("connect", connected);
      socket.off("disconnect", disconnected);
      socket.off(EVENTS.S2C.ROOM_CREATED, roomCreated);
      socket.off(EVENTS.S2C.ROOM_JOINED, roomJoined);
      socket.off(EVENTS.S2C.ROOM_STATE, roomState);
      socket.off(EVENTS.S2C.ROOM_UPDATED, roomUpdated);
      socket.off(EVENTS.S2C.ROOM_CLOSED, roomClosed);
      socket.off(EVENTS.S2C.CATALOG_REFRESH, catalogRefresh);
      socket.off(EVENTS.S2C.GAME_STARTED, gameStarted);
      socket.off(EVENTS.S2C.ROUND_STARTED, roundStarted);
      socket.off(EVENTS.S2C.ROUND_ENDED, roundEnded);
      socket.off(EVENTS.S2C.GAME_ENDED, gameEnded);
      socket.off(EVENTS.S2C.ERROR, errored);
    };
  }

  public createRoom(payload: RoomCreateCmd): void {
    this.isLeavingRoomSession = false;
    this.getSocket().emit(EVENTS.C2S.ROOM_CREATE, payload);
  }

  public joinRoom(payload: RoomJoinCmd): void {
    this.isLeavingRoomSession = false;
    this.getSocket().emit(EVENTS.C2S.ROOM_JOIN, payload);
  }

  public leaveRoom(payload: RoomLeaveCmd): void {
    this.isLeavingRoomSession = true;
    this.getSocket().emit(EVENTS.C2S.ROOM_LEAVE, payload);
  }

  public startGame(payload: GameStartCmd): void {
    this.getSocket().emit(EVENTS.C2S.GAME_START, payload);
  }

  public exitGame(payload: GameExitCmd): void {
    this.getSocket().emit(EVENTS.C2S.GAME_EXIT, payload);
  }

  public rematchGame(payload: GameRematchCmd): void {
    this.getSocket().emit(EVENTS.C2S.GAME_REMATCH, payload);
  }

  public submitGuess(payload: GuessSubmitCmd): void {
    this.getSocket().emit(EVENTS.C2S.GUESS_SUBMIT, payload);
  }

  private getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        autoConnect: false,
        transports: ["polling", "websocket"],
        upgrade: true,
        timeout: 10_000,
        reconnection: true,
        reconnectionAttempts: Infinity,
      });
    }

    return this.socket;
  }
}

export const socketClient = new AppSocketClient();
