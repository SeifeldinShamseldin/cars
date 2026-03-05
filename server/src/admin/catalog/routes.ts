import type { IncomingMessage, ServerResponse } from "node:http";

import { emitCatalogRefresh } from "../../core/socket/catalogRefresh";

const readFormBody = async (req: IncomingMessage): Promise<URLSearchParams> => {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
};

const redirect = (
  res: ServerResponse,
  location: string,
): void => {
  res.writeHead(303, {
    Location: location,
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store",
  });
  res.end();
};

export const handleAdminCatalogRequest = async ({
  req,
  res,
  writeJson,
}: {
  req: IncomingMessage;
  res: ServerResponse;
  writeJson: (res: ServerResponse, statusCode: number, payload: unknown) => void;
}): Promise<boolean> => {
  if (req.method !== "POST" || req.url !== "/admin/catalog/force-refresh") {
    return false;
  }

  const body = await readFormBody(req);
  const returnTo = body.get("returnTo")?.trim() || "/admin/updates";
  const didEmit = emitCatalogRefresh({
    reason: "ADMIN_FORCE_UPDATE",
    requestedAt: Date.now(),
  });

  if (!didEmit) {
    writeJson(res, 503, {
      code: "SOCKET_SERVER_UNAVAILABLE",
      message: "Socket server is not ready.",
    });
    return true;
  }

  redirect(res, returnTo);
  return true;
};
