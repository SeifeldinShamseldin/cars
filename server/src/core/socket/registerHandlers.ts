import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "../../../shared/types/domain";
import { EVENTS } from "../../../shared/types/events";
import type { Server } from "socket.io";
import { setSocketServer } from "./catalogRefresh";
import { GameService } from "../games/gameService";
import { setActiveGameService } from "../games/runtime";

export const registerHandlers = (
  io: Server<ClientToServerEvents, ServerToClientEvents>,
): void => {
  setSocketServer(io);
  const gameService = new GameService(io);
  setActiveGameService(gameService);

  io.on("connection", (socket) => {
    socket.on(EVENTS.C2S.ROOM_CREATE, (payload) => {
      if (!gameService.consumeRateLimit(socket)) {
        return;
      }

      gameService.handleRoomCreate(socket, payload);
    });

    socket.on(EVENTS.C2S.ROOM_JOIN, (payload) => {
      if (!gameService.consumeRateLimit(socket)) {
        return;
      }

      gameService.handleRoomJoin(socket, payload);
    });

    socket.on(EVENTS.C2S.ROOM_LEAVE, (payload) => {
      if (!gameService.consumeRateLimit(socket)) {
        return;
      }

      gameService.handleRoomLeave(socket, payload);
    });

    socket.on(EVENTS.C2S.ROOM_SYNC, (payload) => {
      if (!gameService.consumeRateLimit(socket)) {
        return;
      }

      gameService.handleRoomSync(socket, payload);
    });

    socket.on(EVENTS.C2S.GAME_SELECT, (payload) => {
      if (!gameService.consumeRateLimit(socket)) {
        return;
      }

      gameService.handleGameSelect(socket, payload);
    });

    socket.on(EVENTS.C2S.GAME_START, (payload) => {
      if (!gameService.consumeRateLimit(socket)) {
        return;
      }

      gameService.handleGameStart(socket, payload);
    });

    socket.on(EVENTS.C2S.GAME_EXIT, (payload) => {
      if (!gameService.consumeRateLimit(socket)) {
        return;
      }

      gameService.handleGameExit(socket, payload);
    });

    socket.on(EVENTS.C2S.GAME_REMATCH, (payload) => {
      if (!gameService.consumeRateLimit(socket)) {
        return;
      }

      gameService.handleGameRematch(socket, payload);
    });

    socket.on(EVENTS.C2S.GAME_NEXT, (payload) => {
      if (!gameService.consumeRateLimit(socket)) {
        return;
      }

      gameService.handleGameNext(socket, payload);
    });

    socket.on(EVENTS.C2S.GUESS_SUBMIT, (payload) => {
      if (!gameService.consumeRateLimit(socket)) {
        return;
      }

      gameService.handleGuessSubmit(socket, payload);
    });

    socket.on("disconnect", () => {
      gameService.handleDisconnect(socket);
    });
  });
};
