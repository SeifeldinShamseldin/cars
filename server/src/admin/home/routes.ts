import type { IncomingMessage, ServerResponse } from "node:http";

import { renderAdminHomeHtml } from "./view";

export const handleAdminHomeRequest = async ({
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
  if (req.method !== "GET") {
    return false;
  }

  if (requestUrl.pathname !== "/admin" && requestUrl.pathname !== "/admin/") {
    return false;
  }

  writeHtml(res, 200, renderAdminHomeHtml({ baseUrl }));
  return true;
};
