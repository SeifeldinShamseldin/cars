const escapeHtml = (value: unknown): string =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const renderAdminHomeHtml = ({
  baseUrl,
}: {
  baseUrl: string;
}): string => {
  const cards = [
    {
      title: "Add User",
      description: "Generate seller access codes and inspect active sessions.",
      href: "/admin/access",
    },
    {
      title: "Updates Admin",
      description: "Manage update posts, visibility, and featured placement.",
      href: "/admin/updates",
    },
    {
      title: "Listing Moderation",
      description: "Review seller listings, approvals, and featured requests.",
      href: "/admin/listings",
    },
    {
      title: "DB Admin",
      description: "Inspect and edit the SQLite-backed catalog tables.",
      href: "/admin/db",
    },
    {
      title: "Rooms Monitor",
      description: "Inspect live rooms, players, timers, and persistent room audit history.",
      href: "/admin/rooms",
    },
    {
      title: "API Docs",
      description: "Open Swagger UI for the backend API and event-adjacent HTTP routes.",
      href: "/api-docs",
    },
  ];

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Car Party Admin</title>
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
          .hero {
            display: grid;
            gap: 10px;
            margin-bottom: 24px;
          }
          .hero h1,
          .card h2,
          .card p {
            margin: 0;
          }
          .hero h1 {
            font-size: 40px;
            line-height: 1;
          }
          .subtle {
            color: var(--ink-soft);
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 16px;
          }
          .card {
            display: grid;
            gap: 10px;
            min-height: 180px;
            padding: 22px;
            border-radius: 24px;
            border: 1px solid var(--line);
            background: var(--surface);
            color: inherit;
            text-decoration: none;
          }
          .card:hover {
            border-color: rgba(231, 211, 26, 0.55);
            background: var(--surface-alt);
          }
          .cta {
            margin-top: auto;
            color: var(--primary);
            font-weight: 700;
          }
        </style>
      </head>
      <body>
        <main class="page">
          <section class="hero">
            <h1>Car Party Admin</h1>
            <p class="subtle">Base URL: ${escapeHtml(baseUrl)}</p>
            <p class="subtle">Use the admin tools below, or open API Docs to inspect Swagger.</p>
          </section>

          <section class="grid">
            ${cards
              .map(
                (card) => `
                  <a class="card" href="${escapeHtml(card.href)}">
                    <h2>${escapeHtml(card.title)}</h2>
                    <p class="subtle">${escapeHtml(card.description)}</p>
                    <span class="cta">Open</span>
                  </a>
                `,
              )
              .join("")}
          </section>
        </main>
      </body>
    </html>
  `;
};
