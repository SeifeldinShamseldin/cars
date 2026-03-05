import type { AdminRoomsDashboard } from "./service";

const escapeHtml = (value: unknown): string =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatTime = (value?: number | string): string => {
  if (value === undefined) {
    return "—";
  }

  const date = typeof value === "number" ? new Date(value) : new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

export const renderAdminRoomsHtml = ({
  baseUrl,
  dashboard,
}: {
  baseUrl: string;
  dashboard: AdminRoomsDashboard;
}): string => `
  <!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta http-equiv="refresh" content="4" />
      <title>Admin Rooms Monitor</title>
      <style>
        :root {
          color-scheme: dark;
          --bg: #06080b;
          --surface: #0f1318;
          --surface-alt: #171c23;
          --line: #28303a;
          --ink: #f7f7f2;
          --ink-soft: #98a1ab;
          --accent: #ebd41d;
          --danger: #d85b5b;
          --success: #5fc089;
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          background: var(--bg);
          color: var(--ink);
        }
        .page {
          max-width: 1380px;
          margin: 0 auto;
          padding: 28px 20px 72px;
        }
        .hero,
        .summary,
        .grid,
        .events {
          margin-bottom: 22px;
        }
        .hero h1,
        .hero p,
        .card h2,
        .stat strong,
        .section-title,
        .event-card h3,
        .event-card p {
          margin: 0;
        }
        .hero {
          display: grid;
          gap: 8px;
        }
        .hero h1 {
          font-size: 38px;
          line-height: 1;
        }
        .subtle {
          color: var(--ink-soft);
        }
        .home-link {
          color: var(--accent);
          text-decoration: none;
          font-weight: 700;
        }
        .summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 14px;
        }
        .stat,
        .card,
        .event-card {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 22px;
        }
        .stat {
          padding: 18px;
          display: grid;
          gap: 8px;
        }
        .stat strong {
          font-size: 30px;
        }
        .section-title {
          font-size: 22px;
          margin-bottom: 12px;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 16px;
        }
        .card {
          padding: 18px;
          display: grid;
          gap: 14px;
        }
        .card-head {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
        }
        .badge-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          border: 1px solid var(--line);
          background: var(--surface-alt);
        }
        .badge.ok { color: var(--success); }
        .badge.warn { color: var(--accent); }
        .badge.danger { color: var(--danger); }
        .facts {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px 14px;
        }
        .fact {
          display: grid;
          gap: 3px;
        }
        .fact-label {
          font-size: 12px;
          color: var(--ink-soft);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .players {
          display: grid;
          gap: 8px;
        }
        .player {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
          padding: 10px 12px;
          border-radius: 16px;
          background: var(--surface-alt);
        }
        .player-meta {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          color: var(--ink-soft);
          font-size: 12px;
        }
        .events-list {
          display: grid;
          gap: 12px;
        }
        .event-card {
          padding: 16px;
          display: grid;
          gap: 10px;
        }
        .event-players {
          color: var(--ink-soft);
          font-size: 13px;
          line-height: 1.4;
        }
      </style>
    </head>
    <body>
      <main class="page">
        <section class="hero">
          <h1>Rooms Monitor</h1>
          <p class="subtle">Base URL: ${escapeHtml(baseUrl)}</p>
          <p class="subtle">Live rooms come from the in-memory room manager. Recent history comes from the persistent room events table.</p>
          <a class="home-link" href="/admin">Admin Home</a>
        </section>

        <section class="summary">
          <div class="stat"><span class="subtle">Active rooms</span><strong>${dashboard.live.activeRoomCount}</strong></div>
          <div class="stat"><span class="subtle">Players in rooms</span><strong>${dashboard.live.totalPlayerCount}</strong></div>
          <div class="stat"><span class="subtle">Connected players</span><strong>${dashboard.live.connectedPlayerCount}</strong></div>
          <div class="stat"><span class="subtle">Recent audit events</span><strong>${dashboard.recentEvents.length}</strong></div>
        </section>

        <section>
          <h2 class="section-title">Live Rooms</h2>
          <div class="grid">
            ${
              dashboard.live.rooms.length > 0
                ? dashboard.live.rooms
                    .map(
                      (room) => `
                        <article class="card">
                          <div class="card-head">
                            <div>
                              <h2>${escapeHtml(room.roomCode)}</h2>
                              <p class="subtle">${escapeHtml(room.gameType)} · ${escapeHtml(room.status)}</p>
                            </div>
                            <div class="badge-row">
                              <span class="badge ${room.status === "CLOSING" ? "warn" : "ok"}">${escapeHtml(room.status)}</span>
                              <span class="badge ${room.connectedCount === room.playerCount ? "ok" : "danger"}">${room.connectedCount}/${room.playerCount} connected</span>
                              ${room.cleanupExpiresAt ? `<span class="badge warn">cleanup scheduled</span>` : ""}
                              ${room.hostReconnectExpiresAt ? `<span class="badge warn">host reconnect grace</span>` : ""}
                            </div>
                          </div>
                          <div class="facts">
                            <div class="fact"><span class="fact-label">Round</span><span>${room.round}</span></div>
                            <div class="fact"><span class="fact-label">Version</span><span>${room.version}</span></div>
                            <div class="fact"><span class="fact-label">Created</span><span>${escapeHtml(formatTime(room.createdAt))}</span></div>
                            <div class="fact"><span class="fact-label">Updated</span><span>${escapeHtml(formatTime(room.updatedAt))}</span></div>
                            <div class="fact"><span class="fact-label">Round ends</span><span>${escapeHtml(formatTime(room.roundEndsAt))}</span></div>
                            <div class="fact"><span class="fact-label">Next round</span><span>${escapeHtml(formatTime(room.nextRoundStartsAt))}</span></div>
                            <div class="fact"><span class="fact-label">Room closes</span><span>${escapeHtml(formatTime(room.roomClosesAt))}</span></div>
                            <div class="fact"><span class="fact-label">Cleanup expires</span><span>${escapeHtml(formatTime(room.cleanupExpiresAt))}</span></div>
                          </div>
                          <div class="players">
                            ${room.players
                              .map(
                                (player) => `
                                  <div class="player">
                                    <div>
                                      <strong>${escapeHtml(player.nickname)}</strong>
                                      <div class="player-meta">
                                        <span>${player.isHost ? "host" : "player"}</span>
                                        <span>${player.connected ? "connected" : "disconnected"}</span>
                                        <span>joined ${escapeHtml(formatTime(player.joinedAt))}</span>
                                      </div>
                                    </div>
                                    ${player.disconnectedAt ? `<span class="subtle">left socket ${escapeHtml(formatTime(player.disconnectedAt))}</span>` : ""}
                                  </div>
                                `,
                              )
                              .join("")}
                          </div>
                        </article>
                      `,
                    )
                    .join("")
                : `<article class="card"><p class="subtle">No live rooms right now.</p></article>`
            }
          </div>
        </section>

        <section class="events">
          <h2 class="section-title">Recent Room Events</h2>
          <div class="events-list">
            ${
              dashboard.recentEvents.length > 0
                ? dashboard.recentEvents
                    .map(
                      (event) => `
                        <article class="event-card">
                          <div class="card-head">
                            <div>
                              <h3>${escapeHtml(event.eventType)}</h3>
                              <p class="subtle">${escapeHtml(event.roomCode)} · ${escapeHtml(event.gameType ?? "NONE")} · ${escapeHtml(event.roomStatus ?? "—")}</p>
                            </div>
                            <span class="subtle">${escapeHtml(formatTime(event.createdAt))}</span>
                          </div>
                          <p class="subtle">
                            players: ${event.playerCount},
                            connected: ${event.connectedCount}
                            ${event.playerName ? `, actor: ${escapeHtml(event.playerName)}` : ""}
                            ${event.reason ? `, reason: ${escapeHtml(event.reason)}` : ""}
                          </p>
                          <div class="event-players">
                            ${event.players.map((player) => `${escapeHtml(player.nickname)}${player.isHost ? " (host)" : ""}${player.connected ? "" : " [offline]"}`).join(", ")}
                          </div>
                        </article>
                      `,
                    )
                    .join("")
                : `<article class="event-card"><p class="subtle">No room events recorded yet.</p></article>`
            }
          </div>
        </section>
      </main>
    </body>
  </html>
`;
