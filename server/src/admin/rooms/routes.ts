import type { IncomingMessage, ServerResponse } from "node:http";

import { getRecentRoomAuditEvents } from "./service";
import { renderAdminRoomsHtml } from "./view";
import { getActiveGameService } from "../../core/games/runtime";

export const handleAdminRoomsRequest = async ({
  req,
  res,
  requestUrl,
  baseUrl,
  writeHtml,
}: {
  req: IncomingMessage;
  res: ServerResponse;
  requestUrl: URL;
  baseUrl: string;
  writeHtml: (res: ServerResponse, statusCode: number, payload: string) => void;
}): Promise<boolean> => {
  if (req.method !== "GET" || requestUrl.pathname !== "/admin/rooms") {
    return false;
  }

  const gameService = getActiveGameService();
  const live = gameService?.getAdminRoomMonitorSnapshot() ?? {
    activeRoomCount: 0,
    totalPlayerCount: 0,
    connectedPlayerCount: 0,
    rooms: [],
  };

  writeHtml(
    res,
    200,
    renderAdminRoomsHtml({
      baseUrl,
      dashboard: {
        live,
        recentEvents: getRecentRoomAuditEvents(120),
      },
    }),
  );
  return true;
};
