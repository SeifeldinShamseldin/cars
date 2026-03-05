import type {
  SellerAccessLockRecord,
  SellerAccessSessionRecord,
  SellerInviteRecord,
} from "./service";

const escapeHtml = (value: unknown): string =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const renderAdminAccessHtml = ({
  generatedInvite,
  invites,
  locks,
  sessions,
  phoneDraft,
  errorMessage,
}: {
  generatedInvite?: { phone: string; code: string; expiresAt: string };
  invites: SellerInviteRecord[];
  locks: SellerAccessLockRecord[];
  sessions: SellerAccessSessionRecord[];
  phoneDraft?: string;
  errorMessage?: string;
}): string => {
  const inviteCards = invites
    .map(
      (invite) => `
        <article class="card">
          <div class="row spread">
            <div>
              <h3>${escapeHtml(invite.phone)}</h3>
              <p>Created ${escapeHtml(invite.createdAt)}</p>
              <p>Expires ${escapeHtml(invite.expiresAt)}</p>
            </div>
            <form method="post" action="/admin/access/${encodeURIComponent(invite.id)}/revoke">
              <button type="submit" class="delete">Revoke</button>
            </form>
          </div>
        </article>
      `,
    )
    .join("");

  const lockCards = locks
    .map(
      (lock) => `
        <article class="card">
          <h3>${escapeHtml(lock.phone)}</h3>
          <p>Failed attempts: ${escapeHtml(lock.failedAttempts)}</p>
          <p>Locked until ${escapeHtml(lock.lockedUntil)}</p>
        </article>
      `,
    )
    .join("");

  const sessionCards = sessions
    .map(
      (session) => `
        <article class="card">
          <h3>${escapeHtml(session.phone)}</h3>
          <p>Granted ${escapeHtml(session.grantedAt)}</p>
          <p>Access expires ${escapeHtml(session.accessExpiresAt)}</p>
          <p>Refresh expires ${escapeHtml(session.refreshExpiresAt)}</p>
        </article>
      `,
    )
    .join("");

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Car Party Add User</title>
        <style>
          :root {
            color-scheme: dark;
            --bg: #050608;
            --surface: #0c0f13;
            --surface-alt: #14181d;
            --ink: #f4f4ef;
            --ink-soft: #979da7;
            --line: #252a32;
            --primary: #e7d31a;
            --danger: #d96652;
            --success: #59b07b;
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            background: var(--bg);
            color: var(--ink);
          }
          .page {
            max-width: 1120px;
            margin: 0 auto;
            padding: 28px 20px 64px;
          }
          .topbar {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 22px;
          }
          .topbar h1, .section h2, .card h3, .hero h2 { margin: 0; }
          .subtle {
            color: var(--ink-soft);
            margin-top: 6px;
          }
          .links {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
          }
          .home-link {
            margin-left: auto;
          }
          .links a,
          .links button {
            color: var(--primary);
            text-decoration: none;
            background: transparent;
            border: none;
            cursor: pointer;
            font: inherit;
            padding: 0;
          }
          .force-form {
            margin: 0;
          }
          .force-button,
          .submit-button {
            border: none;
            cursor: pointer;
            font: inherit;
            border-radius: 14px;
            padding: 12px 18px;
            background: var(--primary);
            color: #111;
            font-weight: 800;
          }
          .layout {
            display: grid;
            gap: 20px;
          }
          .hero,
          .section,
          .generated {
            background: var(--surface);
            border: 1px solid var(--line);
            border-radius: 24px;
            padding: 22px;
          }
          .hero form {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-top: 18px;
          }
          input {
            min-width: 280px;
            flex: 1 1 320px;
            border-radius: 14px;
            border: 1px solid var(--line);
            background: #090b0f;
            color: var(--ink);
            padding: 14px 16px;
            font: inherit;
          }
          .error {
            color: #ff9b8d;
            margin-top: 14px;
          }
          .generated {
            border-color: rgba(231, 211, 26, 0.4);
            background: rgba(231, 211, 26, 0.08);
          }
          .otp-code {
            font-size: 44px;
            font-weight: 900;
            letter-spacing: 0.12em;
            color: var(--primary);
            margin: 12px 0;
          }
          .section-header {
            display: flex;
            align-items: baseline;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 14px;
          }
          .grid {
            display: grid;
            gap: 14px;
          }
          .card {
            border: 1px solid var(--line);
            background: var(--surface-alt);
            border-radius: 18px;
            padding: 16px;
          }
          .card p {
            margin: 8px 0 0;
            color: var(--ink-soft);
          }
          .row {
            display: flex;
            gap: 12px;
          }
          .spread {
            justify-content: space-between;
            align-items: flex-start;
          }
          .delete {
            border: none;
            cursor: pointer;
            font: inherit;
            padding: 10px 14px;
            border-radius: 12px;
            background: rgba(217, 102, 82, 0.18);
            color: #ffb0a4;
            font-weight: 700;
          }
          .empty {
            color: var(--ink-soft);
            padding: 18px;
            border: 1px dashed var(--line);
            border-radius: 18px;
            background: rgba(255,255,255,0.01);
          }
          @media (max-width: 720px) {
            .topbar {
              align-items: flex-start;
              flex-direction: column;
            }
            .row.spread {
              flex-direction: column;
            }
            input {
              min-width: 0;
            }
          }
        </style>
      </head>
      <body>
        <main class="page">
          <div class="topbar">
            <div>
              <h1>Add user</h1>
              <p class="subtle">Generate a 2-minute one-time access code for a seller phone number.</p>
            </div>
            <div class="links">
              <form class="force-form" method="post" action="/admin/catalog/force-refresh">
                <input type="hidden" name="returnTo" value="/admin/access" />
                <button type="submit" class="force-button">Force update</button>
              </form>
              <a class="home-link" href="/admin">Admin Home</a>
            </div>
          </div>

          <div class="layout">
            <section class="hero">
              <h2>Create seller access code</h2>
              <p class="subtle">Send the generated code manually. It works once and expires after 2 minutes.</p>
              <form method="post" action="/admin/access/create">
                <input
                  type="text"
                  name="phone"
                  placeholder="Seller phone number"
                  value="${escapeHtml(phoneDraft ?? "")}"
                  required
                />
                <button type="submit" class="submit-button">Generate code</button>
              </form>
              ${errorMessage ? `<p class="error">${escapeHtml(errorMessage)}</p>` : ""}
            </section>

            ${
              generatedInvite
                ? `
                  <section class="generated">
                    <h2>New code</h2>
                    <p class="subtle">${escapeHtml(generatedInvite.phone)}</p>
                    <div class="otp-code">${escapeHtml(generatedInvite.code)}</div>
                    <p class="subtle">Expires ${escapeHtml(generatedInvite.expiresAt)}</p>
                  </section>
                `
                : ""
            }

            <section class="section">
              <div class="section-header">
                <h2>Active invites</h2>
                <span class="subtle">${escapeHtml(invites.length)}</span>
              </div>
              <div class="grid">
                ${inviteCards || '<div class="empty">No active invites.</div>'}
              </div>
            </section>

            <section class="section">
              <div class="section-header">
                <h2>Locked phones</h2>
                <span class="subtle">${escapeHtml(locks.length)}</span>
              </div>
              <div class="grid">
                ${lockCards || '<div class="empty">No locked phones.</div>'}
              </div>
            </section>

            <section class="section">
              <div class="section-header">
                <h2>Active sessions</h2>
                <span class="subtle">${escapeHtml(sessions.length)}</span>
              </div>
              <div class="grid">
                ${sessionCards || '<div class="empty">No active seller sessions yet.</div>'}
              </div>
            </section>
          </div>
        </main>
      </body>
    </html>
  `;
};
