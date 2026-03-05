import type { IncomingMessage, ServerResponse } from "node:http";

import {
  createSellerInvite,
  getSellerAccessOverview,
  revokeSellerInvite,
} from "./service";
import { renderAdminAccessHtml } from "./view";

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

export const handleAdminAccessRequest = async ({
  req,
  res,
  requestUrl,
  writeHtml,
}: {
  req: IncomingMessage;
  res: ServerResponse;
  requestUrl: URL;
  writeHtml: (res: ServerResponse, statusCode: number, payload: string) => void;
}): Promise<boolean> => {
  if (req.method === "GET" && requestUrl.pathname === "/admin/access") {
    const overview = getSellerAccessOverview();
    writeHtml(
      res,
      200,
      renderAdminAccessHtml({
        invites: overview.invites,
        locks: overview.locks,
        sessions: overview.sessions,
      }),
    );
    return true;
  }

  if (req.method === "POST" && requestUrl.pathname === "/admin/access/create") {
    const body = await readFormBody(req);
    const phone = body.get("phone")?.trim() ?? "";

    try {
      const generatedInvite = createSellerInvite(phone);
      const overview = getSellerAccessOverview();
      writeHtml(
        res,
        200,
        renderAdminAccessHtml({
          generatedInvite,
          invites: overview.invites,
          locks: overview.locks,
          sessions: overview.sessions,
        }),
      );
    } catch (error) {
      const overview = getSellerAccessOverview();
      const message = error instanceof Error ? error.message : "Failed to create access code.";
      writeHtml(
        res,
        400,
        renderAdminAccessHtml({
          invites: overview.invites,
          locks: overview.locks,
          sessions: overview.sessions,
          phoneDraft: phone,
          errorMessage: message,
        }),
      );
    }

    return true;
  }

  if (req.method === "POST" && requestUrl.pathname.match(/^\/admin\/access\/([^/]+)\/revoke$/)) {
    const [, rawInviteId] = requestUrl.pathname.match(/^\/admin\/access\/([^/]+)\/revoke$/) ?? [];
    const inviteId = decodeURIComponent(rawInviteId ?? "");
    revokeSellerInvite(inviteId);
    redirect(res, "/admin/access");
    return true;
  }

  return false;
};
