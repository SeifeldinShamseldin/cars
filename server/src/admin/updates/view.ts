import type {
  AdminUpdateFeatureFilter,
  AdminUpdateRecord,
  AdminUpdatesMode,
  UpdateFeatureStatus,
  UpdateStatus,
} from "./service";

const escapeHtml = (value: unknown): string =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const renderStatusChip = (status: UpdateStatus): string => {
  const tone = status === "VISIBLE" ? "visible" : "hidden";
  return `<span class="status-chip ${tone}">${escapeHtml(status)}</span>`;
};

const renderFeatureRequestChip = (status: UpdateFeatureStatus): string => {
  if (status === "NONE") {
    return "";
  }

  const tone =
    status === "APPROVED"
      ? "approved"
      : status === "REJECTED"
        ? "rejected"
        : "pending";

  return `<span class="request-chip ${tone}">FEATURE REQUEST ${escapeHtml(status)}</span>`;
};

const buildDeleteLabel = (update: AdminUpdateRecord): string =>
  `${update.brand} ${update.model}`.trim();

const hiddenStateInputs = ({
  activeMode,
  activeStatus,
}: {
  activeMode: AdminUpdatesMode;
  activeStatus?: UpdateStatus | AdminUpdateFeatureFilter;
}): string => `
  <input type="hidden" name="mode" value="${escapeHtml(activeMode)}" />
  ${activeStatus ? `<input type="hidden" name="filter" value="${escapeHtml(activeStatus)}" />` : ""}
`;

export const renderAdminUpdatesHtml = ({
  baseUrl,
  activeMode,
  activeStatus,
  counts,
  updates,
}: {
  baseUrl: string;
  activeMode: AdminUpdatesMode;
  activeStatus?: UpdateStatus | AdminUpdateFeatureFilter;
  counts: {
    visible: number;
    hidden: number;
    all: number;
    featured: number;
    featureRequestsPending: number;
    featureAll: number;
    featureApproved: number;
    featureRejected: number;
  };
  updates: AdminUpdateRecord[];
}): string => {
  const moderationFilters: Array<{ key: "ALL" | UpdateStatus; label: string; count: number }> = [
    { key: "ALL", label: "All", count: counts.all },
    { key: "VISIBLE", label: "Visible", count: counts.visible },
    { key: "HIDDEN", label: "Hidden", count: counts.hidden },
  ];
  const featuredFilters: Array<{ key: "ALL" | AdminUpdateFeatureFilter; label: string; count: number }> = [
    { key: "ALL", label: "All", count: counts.featureAll },
    { key: "PENDING", label: "Pending", count: counts.featureRequestsPending },
    { key: "APPROVED", label: "Approved", count: counts.featureApproved },
    { key: "REJECTED", label: "Rejected", count: counts.featureRejected },
  ];
  const filters = activeMode === "FEATURED" ? featuredFilters : moderationFilters;

  const modeTabs = [
    {
      key: "MODERATION" as const,
      label: "Updates Moderation",
      href: "/admin/updates",
      meta: `${counts.visible} visible`,
    },
    {
      key: "FEATURED" as const,
      label: "5 Feature Car Updates",
      href: "/admin/updates?mode=FEATURED",
      meta: `${counts.featured}/5 live · ${counts.featureRequestsPending} requests`,
    },
  ];

  const modeNav = modeTabs
    .map(
      (tab) => `
        <a href="${tab.href}" class="mode-tab${tab.key === activeMode ? " active" : ""}">
          <span>${escapeHtml(tab.label)}</span>
          <strong>${escapeHtml(tab.meta)}</strong>
        </a>
      `,
    )
    .join("");

  const filterNav = [
    ...filters.map((filter) => {
      const isActive =
        (filter.key === "ALL" && !activeStatus) || filter.key === activeStatus;
      const href =
        filter.key === "ALL"
          ? activeMode === "FEATURED"
            ? "/admin/updates?mode=FEATURED"
            : "/admin/updates"
          : activeMode === "FEATURED"
            ? `/admin/updates?mode=FEATURED&filter=${encodeURIComponent(filter.key)}`
            : `/admin/updates?filter=${encodeURIComponent(filter.key)}`;

      return `
        <a href="${href}" class="filter-pill${isActive ? " active" : ""}">
          <span>${filter.label}</span>
          <strong>${filter.count}</strong>
        </a>
      `;
    }),
    ...(activeMode === "FEATURED"
      ? [
          `<div class="feature-summary"><strong>${counts.featured}/5 featured</strong></div>`,
        ]
      : []),
  ].join("");

  const createHref = `/admin/updates/create?mode=${encodeURIComponent(activeMode)}${activeStatus ? `&filter=${encodeURIComponent(activeStatus)}` : ""}`;
  const returnTo = `/admin/updates${activeMode === "FEATURED" ? `?mode=FEATURED${activeStatus ? `&filter=${encodeURIComponent(activeStatus)}` : ""}` : activeStatus ? `?filter=${encodeURIComponent(activeStatus)}` : ""}`;

  const cards = updates
    .map((update) => {
      const featureActions =
        update.status === "VISIBLE"
          ? `
              <div class="feature-position-actions">
                ${[1, 2, 3, 4, 5]
                  .map(
                    (position) => `
                      <form method="post" action="/admin/updates/${encodeURIComponent(update.id)}/feature-position">
                        ${hiddenStateInputs({ activeMode, activeStatus })}
                        <input type="hidden" name="position" value="${position}" />
                        <button type="submit" class="feature-slot${update.featuredPosition === position ? " active" : ""}">${position}</button>
                      </form>
                    `,
                  )
                  .join("")}
                <form method="post" action="/admin/updates/${encodeURIComponent(update.id)}/unfeature">
                  ${hiddenStateInputs({ activeMode, activeStatus })}
                  <button type="submit" class="toggle">Remove From Featured</button>
                </form>
              </div>
            `
          : "";

      const featureRequestActions =
        activeMode === "FEATURED" && update.featuredRequestStatus === "PENDING"
          ? `
              <form method="post" action="/admin/updates/${encodeURIComponent(update.id)}/feature-request-reject">
                ${hiddenStateInputs({ activeMode, activeStatus })}
                <button type="submit" class="delete">Reject Feature Request</button>
              </form>
            `
          : "";

      return `
        <article class="update-card">
          <div class="update-head">
            <div>
              <div class="update-meta-top">
                ${renderStatusChip(update.status)}
                ${update.isFeatured ? '<span class="feature-chip">FEATURED LIVE</span>' : ""}
                ${update.featuredPosition !== null ? `<span class="feature-chip">SLOT ${escapeHtml(update.featuredPosition)}</span>` : ""}
                ${renderFeatureRequestChip(update.featuredRequestStatus)}
                <span class="update-date">${escapeHtml(update.postedAt)}</span>
              </div>
              <h2>${escapeHtml(`${update.brand} ${update.model}`)}</h2>
              <p class="subtitle">${escapeHtml(`${update.bodyType} · ${update.year}`)}</p>
            </div>
          </div>

          ${
            update.galleryImageUrls.length > 0
              ? `
                <div class="image-row">
                  ${update.galleryImageUrls
                    .slice(0, 5)
                    .map(
                      (imageUrl) => `
                        <a href="${escapeHtml(imageUrl)}" target="_blank" rel="noreferrer">
                          <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(update.model)}" />
                        </a>
                      `,
                    )
                    .join("")}
                </div>
              `
              : ""
          }

          <p class="description">${escapeHtml(update.description)}</p>

          <div class="actions">
            <a class="edit-link" href="/admin/updates/${encodeURIComponent(update.id)}/edit?mode=${encodeURIComponent(activeMode)}${activeStatus ? `&filter=${encodeURIComponent(activeStatus)}` : ""}">Edit</a>
            ${
              activeMode === "MODERATION"
                ? `
                    <form method="post" action="/admin/updates/${encodeURIComponent(update.id)}/${update.status === "VISIBLE" ? "hide" : "show"}">
                      ${hiddenStateInputs({ activeMode, activeStatus })}
                      <button type="submit" class="toggle">${update.status === "VISIBLE" ? "Hide" : "Show"}</button>
                    </form>
                    <form method="post" action="/admin/updates/${encodeURIComponent(update.id)}/delete">
                      <input type="hidden" name="confirmLabel" value="${escapeHtml(buildDeleteLabel(update))}" />
                      ${hiddenStateInputs({ activeMode, activeStatus })}
                      <button type="submit" class="delete">Delete</button>
                    </form>
                  `
                : ""
            }
            ${featureActions}
            ${featureRequestActions}
          </div>
        </article>
      `;
    })
    .join("");

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Car Party Updates Admin</title>
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
            --success: #59b07b;
            --danger: #d96652;
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            background: var(--bg);
            color: var(--ink);
          }
          .page {
            max-width: 1240px;
            margin: 0 auto;
            padding: 28px 20px 60px;
          }
          .topbar {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 20px;
          }
          .top-actions {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
          }
          .home-link {
            margin-left: auto;
          }
          .subtle {
            color: var(--ink-soft);
            margin-top: 8px;
          }
          a {
            color: var(--primary);
            text-decoration: none;
          }
          .force-button,
          .post-link {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 44px;
            width: auto;
            border: 0;
            border-radius: 14px;
            background: var(--primary);
            color: #050608;
            font-weight: 800;
            padding: 0 16px;
            cursor: pointer;
          }
          .mode-tabs {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 12px;
            margin-bottom: 18px;
          }
          .mode-tab {
            display: flex;
            flex-direction: column;
            gap: 8px;
            border-radius: 18px;
            border: 1px solid var(--line);
            background: var(--surface);
            padding: 16px 18px;
            color: var(--ink);
          }
          .mode-tab strong {
            color: var(--primary);
            font-size: 13px;
          }
          .mode-tab.active {
            border-color: var(--primary);
            background: rgba(231, 211, 26, 0.07);
          }
          .filters {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 22px;
          }
          .filter-pill,
          .feature-summary {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            border-radius: 999px;
            padding: 12px 16px;
            background: var(--surface-alt);
            color: var(--ink);
            border: 1px solid transparent;
          }
          .feature-summary {
            justify-content: space-between;
            width: 100%;
            border-radius: 18px;
            padding: 16px 18px;
          }
          .feature-summary strong,
          .filter-pill strong {
            color: var(--primary);
            font-size: 13px;
          }
          .filter-pill.active {
            border-color: var(--primary);
            background: rgba(231, 211, 26, 0.08);
          }
          .cards {
            display: grid;
            gap: 18px;
          }
          .update-card {
            border-radius: 24px;
            border: 1px solid var(--line);
            background: var(--surface);
            padding: 20px;
          }
          .update-head h2 {
            margin: 0;
          }
          button {
            width: 100%;
            min-height: 46px;
            border-radius: 14px;
            border: 1px solid var(--line);
            background: var(--surface-alt);
            color: var(--ink);
            padding: 0 14px;
            font: inherit;
          }
          .update-meta-top {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
            margin-bottom: 8px;
          }
          .status-chip,
          .feature-chip,
          .request-chip {
            display: inline-flex;
            align-items: center;
            border-radius: 999px;
            padding: 6px 10px;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.06em;
          }
          .status-chip.visible {
            background: rgba(89, 176, 123, 0.16);
            color: var(--success);
          }
          .status-chip.hidden {
            background: rgba(217, 102, 82, 0.16);
            color: var(--danger);
          }
          .request-chip.pending {
            background: rgba(231, 211, 26, 0.16);
            color: var(--primary);
          }
          .request-chip.approved {
            background: rgba(89, 176, 123, 0.16);
            color: var(--success);
          }
          .request-chip.rejected {
            background: rgba(217, 102, 82, 0.16);
            color: var(--danger);
          }
          .feature-chip {
            background: rgba(231, 211, 26, 0.12);
            color: var(--primary);
          }
          .subtitle,
          .description,
          .update-date,
          .empty {
            color: var(--ink-soft);
          }
          .image-row {
            display: flex;
            gap: 10px;
            overflow: auto;
            margin: 16px 0;
          }
          .image-row img {
            width: 160px;
            height: 104px;
            object-fit: cover;
            border-radius: 16px;
            background: var(--surface-alt);
            border: 1px solid var(--line);
          }
          .actions {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
          }
          .feature-position-actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
          }
          .edit-link {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 46px;
            border-radius: 14px;
            padding: 0 18px;
            font-weight: 800;
            background: var(--surface-alt);
            color: var(--ink);
            border: 1px solid var(--line);
          }
          form { margin: 0; }
          button.toggle {
            background: rgba(231, 211, 26, 0.18);
            color: var(--primary);
          }
          button.delete {
            background: rgba(217, 102, 82, 0.18);
            color: var(--danger);
          }
          button.feature-slot {
            min-width: 46px;
            padding: 0 14px;
            background: var(--surface-alt);
            color: var(--ink);
            border: 1px solid var(--line);
          }
          button.feature-slot.active {
            background: var(--primary);
            color: #050608;
            border-color: transparent;
          }
          .empty {
            border-radius: 24px;
            border: 1px dashed var(--line);
            padding: 32px 22px;
            text-align: center;
          }
          @media (max-width: 980px) {
            .topbar {
              flex-direction: column;
              align-items: stretch;
            }
          }
          @media (max-width: 720px) {
            .actions {
              flex-direction: column;
            }
            button {
              width: 100%;
            }
            .feature-summary {
              align-items: flex-start;
              flex-direction: column;
            }
          }
        </style>
      </head>
      <body>
        <main class="page">
          <div class="topbar">
            <div>
              <h1>Updates Admin</h1>
              <p class="subtle">${escapeHtml(baseUrl)}</p>
            </div>
            <div class="top-actions">
              <a class="post-link" href="${createHref}">Post update</a>
              <form method="post" action="/admin/catalog/force-refresh">
                <input type="hidden" name="returnTo" value="${escapeHtml(returnTo)}" />
                <button type="submit" class="force-button">Force update</button>
              </form>
              <a class="home-link" href="/admin">Admin Home</a>
            </div>
          </div>

          <nav class="mode-tabs">${modeNav}</nav>
          <nav class="filters">${filterNav}</nav>

          <section class="cards">
            ${
              updates.length > 0
                ? cards
                : `<div class="empty">No updates found for this view.</div>`
            }
          </section>
        </main>
        <script>
          (() => {
            const key = "admin-scroll:" + window.location.pathname + window.location.search;
            const savedScroll = window.sessionStorage.getItem(key);
            if (savedScroll) {
              window.scrollTo(0, Number(savedScroll));
              window.sessionStorage.removeItem(key);
            }
            document.querySelectorAll("form").forEach((form) => {
              form.addEventListener("submit", (event) => {
                const action = form.getAttribute("action") || "";
                if (action.endsWith("/delete")) {
                  const labelInput = form.querySelector('input[name="confirmLabel"]');
                  const label = labelInput instanceof HTMLInputElement ? labelInput.value : "this update";
                  const confirmed = window.confirm('Are you sure you want to delete "' + label + '"?');
                  if (!confirmed) {
                    event.preventDefault();
                    return;
                  }
                }
                window.sessionStorage.setItem(key, String(window.scrollY));
              });
            });
          })();
        </script>
      </body>
    </html>
  `;
};
