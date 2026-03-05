import type {
  AdminListingRecord,
  AdminListingsMode,
  FeaturedRequestStatus,
  ListingStatus,
} from "./service";

const escapeHtml = (value: unknown): string =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatPrice = (value: number): string => `EGP ${value.toLocaleString()}`;

const buildDeleteLabel = (listing: AdminListingRecord): string =>
  `${listing.brand} ${listing.model}`.trim();

const renderStatusChip = (status: ListingStatus): string => {
  const tone =
    status === "APPROVED"
      ? "approved"
      : status === "REJECTED"
        ? "rejected"
        : "pending";
  const label =
    status === "APPROVED"
      ? "SHOWN"
      : status === "REJECTED"
        ? "HIDDEN"
        : "PENDING";

  return `<span class="status-chip ${tone}">${escapeHtml(label)}</span>`;
};

const renderFeatureRequestChip = (status: FeaturedRequestStatus): string => {
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

const hiddenStateInputs = ({
  activeMode,
  activeFilter,
  query,
}: {
  activeMode: AdminListingsMode;
  activeFilter?: ListingStatus;
  query?: string;
}): string => `
  <input type="hidden" name="mode" value="${escapeHtml(activeMode)}" />
  ${activeFilter ? `<input type="hidden" name="filter" value="${escapeHtml(activeFilter)}" />` : ""}
  ${query ? `<input type="hidden" name="q" value="${escapeHtml(query)}" />` : ""}
`;

export const renderAdminListingsHtml = ({
  baseUrl,
  activeMode,
  activeFilter,
  counts,
  listings,
  query,
}: {
  baseUrl: string;
  activeMode: AdminListingsMode;
  activeFilter?: ListingStatus;
  counts: {
    pending: number;
    approved: number;
    rejected: number;
    all: number;
    featured: number;
    featureRequestsPending: number;
    featureAll: number;
    featureApproved: number;
    featureRejected: number;
  };
  listings: AdminListingRecord[];
  query: string;
}): string => {
  const filters: Array<{ key: "ALL" | ListingStatus; label: string; count: number }> =
    activeMode === "FEATURED"
      ? [
          { key: "ALL", label: "All", count: counts.featureAll },
          { key: "PENDING", label: "Pending", count: counts.featureRequestsPending },
          { key: "APPROVED", label: "Approved", count: counts.featureApproved },
          { key: "REJECTED", label: "Rejected", count: counts.featureRejected },
        ]
      : [
          { key: "ALL", label: "All", count: counts.all },
          { key: "APPROVED", label: "Shown", count: counts.approved },
          { key: "REJECTED", label: "Hidden", count: counts.rejected },
        ];

  const modeTabs = [
    {
      key: "MODERATION" as const,
      label: "Sell Moderation",
      href: "/admin/listings",
      meta: `${counts.approved} shown · ${counts.rejected} hidden`,
    },
    {
      key: "FEATURED" as const,
      label: "5 Feature Car Sell",
      href: "/admin/listings?mode=FEATURED",
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
        (filter.key === "ALL" && !activeFilter) || filter.key === activeFilter;
      const href =
        filter.key === "ALL"
          ? activeMode === "FEATURED"
            ? `/admin/listings?mode=FEATURED${query ? `&q=${encodeURIComponent(query)}` : ""}`
            : `/admin/listings${query ? `?q=${encodeURIComponent(query)}` : ""}`
          : activeMode === "FEATURED"
            ? `/admin/listings?mode=FEATURED&filter=${encodeURIComponent(filter.key)}${query ? `&q=${encodeURIComponent(query)}` : ""}`
            : `/admin/listings?filter=${encodeURIComponent(filter.key)}${query ? `&q=${encodeURIComponent(query)}` : ""}`;

      return `
        <a href="${href}" class="filter-pill${isActive ? " active" : ""}">
          <span>${filter.label}</span>
          <strong>${filter.count}</strong>
        </a>
      `;
    }),
    ...(activeMode === "FEATURED"
      ? [
          `
            <div class="feature-summary">
              <strong>${counts.featured}/5 featured</strong>
            </div>
          `,
        ]
      : []),
  ].join("");

  const createHref = `/admin/listings/create?mode=${encodeURIComponent(activeMode)}${activeFilter ? `&filter=${encodeURIComponent(activeFilter)}` : ""}${query ? `&q=${encodeURIComponent(query)}` : ""}`;
  const returnTo = `/admin/listings${activeMode === "FEATURED" ? `?mode=FEATURED${activeFilter ? `&filter=${encodeURIComponent(activeFilter)}` : ""}${query ? `&q=${encodeURIComponent(query)}` : ""}` : activeFilter || query ? `?${activeFilter ? `filter=${encodeURIComponent(activeFilter)}${query ? "&" : ""}` : ""}${query ? `q=${encodeURIComponent(query)}` : ""}` : ""}`;

  const cards = listings
    .map((listing) => {
      const featureActions =
        listing.status === "APPROVED"
          ? `
              <div class="feature-position-actions">
                ${[1, 2, 3, 4, 5]
                  .map(
                    (position) => `
                      <form method="post" action="/admin/listings/${encodeURIComponent(listing.id)}/feature-position">
                        ${hiddenStateInputs({ activeMode, activeFilter, query })}
                        <input type="hidden" name="position" value="${position}" />
                        <button type="submit" class="feature-slot${listing.featuredPosition === position ? " active" : ""}">${position}</button>
                      </form>
                    `,
                  )
                  .join("")}
                <form method="post" action="/admin/listings/${encodeURIComponent(listing.id)}/unfeature">
                  ${hiddenStateInputs({ activeMode, activeFilter, query })}
                  <button type="submit" class="feature-toggle">Remove From Featured</button>
                </form>
              </div>
            `
          : "";

      const requestActions =
        activeMode === "FEATURED" && listing.featuredRequestStatus === "PENDING"
          ? `
              <form method="post" action="/admin/listings/${encodeURIComponent(listing.id)}/feature-request-reject">
                ${hiddenStateInputs({ activeMode, activeFilter, query })}
                <button type="submit" class="reject">Reject Feature Request</button>
              </form>
            `
          : "";

      const moderationActions =
        activeMode === "MODERATION"
          ? listing.status === "APPROVED"
            ? `
                <form method="post" action="/admin/listings/${encodeURIComponent(listing.id)}/reject">
                  ${hiddenStateInputs({ activeMode, activeFilter, query })}
                  <button type="submit" class="reject">Hide</button>
                </form>
              `
            : listing.status === "REJECTED"
              ? `
                  <form method="post" action="/admin/listings/${encodeURIComponent(listing.id)}/approve">
                    ${hiddenStateInputs({ activeMode, activeFilter, query })}
                    <button type="submit" class="approve">Show</button>
                  </form>
                `
              : `
                  <form method="post" action="/admin/listings/${encodeURIComponent(listing.id)}/approve">
                    ${hiddenStateInputs({ activeMode, activeFilter, query })}
                    <button type="submit" class="approve">Show</button>
                  </form>
                  <form method="post" action="/admin/listings/${encodeURIComponent(listing.id)}/reject">
                    ${hiddenStateInputs({ activeMode, activeFilter, query })}
                    <button type="submit" class="reject">Hide</button>
                  </form>
                `
          : "";

      return `
        <article class="listing-card">
          <div class="listing-head">
            <div>
              <div class="listing-meta-top">
                ${renderStatusChip(listing.status)}
                ${listing.isFeatured ? '<span class="feature-chip">FEATURED LIVE</span>' : ""}
                ${listing.featuredPosition !== null ? `<span class="feature-chip">SLOT ${escapeHtml(listing.featuredPosition)}</span>` : ""}
                ${renderFeatureRequestChip(listing.featuredRequestStatus)}
                <span class="listing-date">${escapeHtml(listing.postedAt)}</span>
              </div>
              <h2>${escapeHtml(`${listing.brand} ${listing.model}`)}</h2>
              <p class="seller-line">
                ${escapeHtml(listing.sellerName)} · ${escapeHtml(listing.telephone)} · ${escapeHtml(listing.sellerType)}
              </p>
            </div>
            <div class="price-block">${escapeHtml(formatPrice(listing.priceValue))}</div>
          </div>

          ${
            listing.galleryImageUrls.length > 0
              ? `
                <div class="image-row">
                  ${listing.galleryImageUrls
                    .slice(0, 5)
                    .map(
                      (imageUrl) => `
                        <a href="${escapeHtml(imageUrl)}" target="_blank" rel="noreferrer">
                          <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(listing.model)}" />
                        </a>
                      `,
                    )
                    .join("")}
                </div>
              `
              : ""
          }

          <div class="facts-grid">
            <div class="fact"><span>Type</span><strong>${escapeHtml(listing.bodyType)}</strong></div>
            <div class="fact"><span>Year</span><strong>${escapeHtml(listing.year)}</strong></div>
            <div class="fact"><span>Condition</span><strong>${escapeHtml(listing.condition)}</strong></div>
            <div class="fact"><span>Fuel</span><strong>${escapeHtml(listing.fuelType)}</strong></div>
            <div class="fact"><span>Transmission</span><strong>${escapeHtml(listing.transmission)}</strong></div>
            <div class="fact"><span>Mileage</span><strong>${escapeHtml(listing.mileage.toLocaleString())} KM</strong></div>
            <div class="fact"><span>Rim</span><strong>${escapeHtml(listing.rimSizeInches)}"</strong></div>
            <div class="fact"><span>Color</span><strong>${escapeHtml(listing.color)}</strong></div>
            <div class="fact"><span>Negotiable</span><strong>${escapeHtml(listing.isNegotiable)}</strong></div>
            <div class="fact"><span>Accident</span><strong>${escapeHtml(listing.accidentHistory)}</strong></div>
          </div>

          <p class="description">${escapeHtml(listing.description)}</p>

          <div class="actions">
            <a
              class="edit-link"
              href="/admin/listings/${encodeURIComponent(listing.id)}/edit?mode=${encodeURIComponent(activeMode)}${activeFilter ? `&filter=${encodeURIComponent(activeFilter)}` : ""}${query ? `&q=${encodeURIComponent(query)}` : ""}"
            >
              Edit
            </a>
            <form method="post" action="/admin/listings/${encodeURIComponent(listing.id)}/delete">
              <input type="hidden" name="confirmLabel" value="${escapeHtml(buildDeleteLabel(listing))}" />
              ${hiddenStateInputs({ activeMode, activeFilter, query })}
              <button type="submit" class="delete">Delete</button>
            </form>
            ${moderationActions}
            ${featureActions}
            ${requestActions}
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
        <title>Car Party Listings Admin</title>
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
          .topbar > div:last-child {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
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
          .topbar h1,
          .listing-head h2,
          .price-block,
          .fact strong {
            margin: 0;
          }
          .subtle {
            color: var(--ink-soft);
            margin-top: 8px;
          }
          a {
            color: var(--primary);
            text-decoration: none;
          }
          .post-link,
          .force-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 44px;
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
          .search-row {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
            margin-bottom: 22px;
          }
          .search-form {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
          }
          .search-input {
            min-width: 320px;
            min-height: 44px;
            border-radius: 14px;
            border: 1px solid var(--line);
            background: var(--surface-alt);
            color: var(--ink);
            padding: 0 14px;
            font: inherit;
          }
          .search-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 44px;
            border-radius: 14px;
            padding: 0 16px;
            border: 1px solid var(--line);
            background: var(--surface-alt);
            color: var(--ink);
            font-weight: 700;
            text-decoration: none;
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
          .listing-card {
            border-radius: 24px;
            border: 1px solid var(--line);
            background: var(--surface);
            padding: 20px;
          }
          .listing-head {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 18px;
            margin-bottom: 16px;
          }
          .listing-meta-top {
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
          .status-chip.pending,
          .request-chip.pending {
            background: rgba(231, 211, 26, 0.16);
            color: var(--primary);
          }
          .status-chip.approved,
          .request-chip.approved {
            background: rgba(89, 176, 123, 0.16);
            color: var(--success);
          }
          .status-chip.rejected,
          .request-chip.rejected {
            background: rgba(217, 102, 82, 0.16);
            color: var(--danger);
          }
          .feature-chip {
            background: rgba(231, 211, 26, 0.12);
            color: var(--primary);
          }
          .listing-date,
          .seller-line,
          .description,
          .empty {
            color: var(--ink-soft);
          }
          .seller-line {
            margin: 8px 0 0;
          }
          .price-block {
            color: var(--primary);
            font-size: 22px;
            font-weight: 800;
            white-space: nowrap;
          }
          .image-row {
            display: flex;
            gap: 10px;
            overflow: auto;
            margin-bottom: 16px;
          }
          .image-row a,
          .image-row img {
            display: block;
          }
          .image-row img {
            width: 160px;
            height: 104px;
            object-fit: cover;
            border-radius: 16px;
            background: var(--surface-alt);
            border: 1px solid var(--line);
          }
          .facts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 10px;
            margin-bottom: 14px;
          }
          .fact {
            border-radius: 16px;
            background: var(--surface-alt);
            padding: 12px 14px;
          }
          .fact span {
            display: block;
            color: var(--ink-soft);
            font-size: 11px;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.06em;
          }
          .description {
            margin: 0 0 18px;
            line-height: 1.6;
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
          button {
            min-height: 46px;
            border: 0;
            border-radius: 14px;
            padding: 0 18px;
            font-weight: 800;
            cursor: pointer;
          }
          button.approve {
            background: var(--primary);
            color: #050608;
          }
          button.reject {
            background: rgba(217, 102, 82, 0.18);
            color: var(--danger);
          }
          button.delete {
            background: rgba(217, 102, 82, 0.18);
            color: var(--danger);
          }
          button.feature-toggle {
            background: rgba(231, 211, 26, 0.18);
            color: var(--primary);
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
          @media (max-width: 720px) {
            .listing-head {
              flex-direction: column;
            }
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
              <h1>Listing Moderation</h1>
            </div>
            <div class="top-actions">
              <a class="post-link" href="${createHref}">Post listing</a>
              <form method="post" action="/admin/catalog/force-refresh" style="display:inline-flex;align-items:center;gap:10px">
                <input type="hidden" name="returnTo" value="${escapeHtml(returnTo)}" />
                <button type="submit" class="force-button">Force update</button>
              </form>
              <a class="home-link" href="/admin">Admin Home</a>
            </div>
          </div>

          <nav class="mode-tabs">${modeNav}</nav>
          <nav class="filters">${filterNav}</nav>
          <div class="search-row">
            <form class="search-form" method="get" action="/admin/listings">
              ${activeMode === "FEATURED" ? '<input type="hidden" name="mode" value="FEATURED" />' : ""}
              ${activeFilter ? `<input type="hidden" name="filter" value="${escapeHtml(activeFilter)}" />` : ""}
              <input
                class="search-input"
                type="search"
                name="q"
                value="${escapeHtml(query)}"
                placeholder="Search seller name, phone, brand, model..."
              />
              <button type="submit" class="search-button">Search</button>
            </form>
            ${query ? `<a class="search-button" href="${returnTo.replace(/([?&])q=[^&]*&?/, "$1").replace(/[?&]$/, "")}">Clear</a>` : ""}
          </div>

          <section class="cards">
            ${
              listings.length > 0
                ? cards
                : `<div class="empty">No listings found for this view.</div>`
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
                  const label = labelInput instanceof HTMLInputElement ? labelInput.value : "this listing";
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
