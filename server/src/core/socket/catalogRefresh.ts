import type {
  CatalogRefreshPayload,
  ClientToServerEvents,
  ServerToClientEvents,
} from "../../../shared/types/domain";
import { EVENTS } from "../../../shared/types/events";
import type { Server } from "socket.io";

let socketServer:
  | Server<ClientToServerEvents, ServerToClientEvents>
  | undefined;

export const setSocketServer = (
  io: Server<ClientToServerEvents, ServerToClientEvents>,
): void => {
  socketServer = io;
};

export const emitCatalogRefresh = (
  payload: CatalogRefreshPayload,
): boolean => {
  if (!socketServer) {
    return false;
  }

  socketServer.emit(EVENTS.S2C.CATALOG_REFRESH, payload);
  return true;
};
