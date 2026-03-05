import type {
  AdminUpdateFeatureFilter,
  AdminUpdateRecord,
  AdminUpdatesMode,
  UpdateBodyType,
  UpdateFormInput,
  UpdateStatus,
} from "./service";

const escapeHtml = (value: unknown): string =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const buildUpdatesLocation = ({
  mode,
  filter,
}: {
  mode: AdminUpdatesMode;
  filter?: UpdateStatus | AdminUpdateFeatureFilter;
}): string => {
  const search = new URLSearchParams();

  if (mode === "FEATURED") {
    search.set("mode", mode);
  }
  if (filter) {
    search.set("filter", filter);
  }

  const query = search.toString();
  return query.length > 0 ? `/admin/updates?${query}` : "/admin/updates";
};

const renderAdminUpdateFormHtml = ({
  title,
  subtitle,
  submitLabel,
  actionPath,
  stateTitle,
  brand,
  model,
  bodyType,
  year,
  description,
  postedAt,
  status,
  galleryImageUrls,
  currentState,
  activeMode,
  activeFilter,
  bodyTypes,
}: {
  title: string;
  subtitle: string;
  submitLabel: string;
  actionPath: string;
  stateTitle: string;
  brand: string;
  model: string;
  bodyType: UpdateBodyType;
  year: number;
  description: string;
  postedAt: string;
  status: UpdateStatus;
  galleryImageUrls: string[];
  currentState: Array<{ label: string; value: string }>;
  activeMode: AdminUpdatesMode;
  activeFilter?: UpdateStatus | AdminUpdateFeatureFilter;
  bodyTypes: UpdateBodyType[];
}): string => {
  const returnTo = buildUpdatesLocation({
    mode: activeMode,
    filter: activeFilter,
  });

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(title)}</title>
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
            max-width: 1100px;
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
          .subtle {
            color: var(--ink-soft);
            margin-top: 8px;
          }
          a {
            color: var(--primary);
            text-decoration: none;
          }
          .layout {
            display: grid;
            grid-template-columns: minmax(320px, 1fr) minmax(320px, 1fr);
            gap: 18px;
            align-items: start;
          }
          .panel {
            border-radius: 24px;
            border: 1px solid var(--line);
            background: var(--surface);
            padding: 20px;
          }
          h1, h2, p { margin-top: 0; }
          form {
            display: grid;
            gap: 12px;
          }
          label {
            display: grid;
            gap: 6px;
            color: var(--ink-soft);
            font-size: 13px;
          }
          input,
          textarea,
          select,
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
          input[type="file"] {
            padding: 12px 14px;
            min-height: auto;
          }
          textarea {
            min-height: 120px;
            padding: 12px 14px;
            resize: vertical;
          }
          .existing-gallery {
            display: grid;
            gap: 10px;
            color: var(--ink-soft);
            font-size: 13px;
          }
          .existing-gallery-row {
            display: flex;
            gap: 10px;
            overflow: auto;
          }
          .existing-image-card {
            display: grid;
            gap: 8px;
            min-width: 104px;
            color: var(--ink-soft);
          }
          .existing-gallery-row img {
            width: 104px;
            height: 72px;
            object-fit: cover;
            border-radius: 12px;
            background: var(--surface-alt);
            border: 1px solid var(--line);
          }
          .remove-toggle {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
          }
          .remove-toggle input {
            width: auto;
            min-height: auto;
            accent-color: var(--primary);
          }
          .facts {
            display: grid;
            gap: 10px;
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
          .actions {
            display: flex;
            gap: 10px;
          }
          .primary {
            background: var(--primary);
            color: #050608;
            border-color: transparent;
            font-weight: 800;
          }
          .secondary {
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
          @media (max-width: 840px) {
            .layout,
            .actions {
              grid-template-columns: 1fr;
              flex-direction: column;
            }
          }
        </style>
      </head>
      <body>
        <main class="page">
          <div class="topbar">
            <div>
              <h1>${escapeHtml(title)}</h1>
              <p class="subtle">${escapeHtml(subtitle)}</p>
            </div>
            <a href="${escapeHtml(returnTo)}">Back to updates</a>
          </div>

          <div class="layout">
            <section class="panel">
              <form method="post" action="${escapeHtml(actionPath)}" enctype="multipart/form-data">
                <input type="hidden" name="mode" value="${escapeHtml(activeMode)}" />
                ${activeFilter ? `<input type="hidden" name="filter" value="${escapeHtml(activeFilter)}" />` : ""}

                <label>
                  Brand
                  <input name="brand" required value="${escapeHtml(brand)}" />
                </label>
                <label>
                  Model
                  <input name="model" required value="${escapeHtml(model)}" />
                </label>
                <label>
                  Body type
                  <select name="bodyType" required>
                    ${bodyTypes
                      .map(
                        (item) => `
                          <option value="${escapeHtml(item)}"${item === bodyType ? " selected" : ""}>
                            ${escapeHtml(item)}
                          </option>
                        `,
                      )
                      .join("")}
                  </select>
                </label>
                <label>
                  Year
                  <input type="number" name="year" min="1900" max="2100" required value="${escapeHtml(year)}" />
                </label>
                <label>
                  Description
                  <textarea name="description" required>${escapeHtml(description)}</textarea>
                </label>
                <label>
                  Posted at
                  <input name="postedAt" required value="${escapeHtml(postedAt)}" />
                </label>
                <label>
                  Status
                  <select name="status" required>
                    <option value="VISIBLE"${status === "VISIBLE" ? " selected" : ""}>VISIBLE</option>
                    <option value="HIDDEN"${status === "HIDDEN" ? " selected" : ""}>HIDDEN</option>
                  </select>
                </label>

                <div class="existing-gallery">
                  <span>Current gallery</span>
                  ${
                    galleryImageUrls.length > 0
                      ? `
                        <div class="existing-gallery-row">
                          ${galleryImageUrls
                            .map(
                              (imageUrl, index) => `
                                <label class="existing-image-card">
                                  <img src="${escapeHtml(imageUrl)}" alt="Update image ${index + 1}" />
                                  <span class="remove-toggle">
                                    <input
                                      type="checkbox"
                                      name="removeImagePath-${index}"
                                      value="${escapeHtml(imageUrl)}"
                                    />
                                    Remove image
                                  </span>
                                </label>
                              `,
                            )
                            .join("")}
                        </div>
                      `
                      : `<p>No gallery images yet.</p>`
                  }
                </div>

                <label>
                  Add new images
                  <input name="images" type="file" accept="image/*" multiple />
                </label>

                <div class="actions">
                  <button type="submit" class="primary">${escapeHtml(submitLabel)}</button>
                  <a class="secondary" href="${escapeHtml(returnTo)}">Cancel</a>
                </div>
              </form>
            </section>

            <aside class="panel">
              <h2>${escapeHtml(stateTitle)}</h2>
              <div class="facts">
                ${currentState
                  .map(
                    (item) => `
                      <div class="fact"><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.value)}</strong></div>
                    `,
                  )
                  .join("")}
              </div>
            </aside>
          </div>
        </main>
      </body>
    </html>
  `;
};

export const renderAdminUpdateEditHtml = ({
  update,
  activeMode,
  activeFilter,
  bodyTypes,
}: {
  update: AdminUpdateRecord;
  activeMode: AdminUpdatesMode;
  activeFilter?: UpdateStatus | AdminUpdateFeatureFilter;
  bodyTypes: UpdateBodyType[];
}): string =>
  renderAdminUpdateFormHtml({
    title: "Edit Update",
    subtitle: `${update.brand} ${update.model} · ${update.id}`,
    submitLabel: "Save Update",
    actionPath: `/admin/updates/${encodeURIComponent(update.id)}/update`,
    stateTitle: "Current State",
    brand: update.brand,
    model: update.model,
    bodyType: update.bodyType,
    year: update.year,
    description: update.description,
    postedAt: update.postedAt,
    status: update.status,
    galleryImageUrls: update.galleryImageUrls,
    currentState: [
      { label: "Status", value: update.status },
      { label: "Featured", value: update.isFeatured ? "YES" : "NO" },
      { label: "Feature request", value: update.featuredRequestStatus },
    ],
    activeMode,
    activeFilter,
    bodyTypes,
  });

export const renderAdminUpdateCreateHtml = ({
  activeMode,
  activeFilter,
  bodyTypes,
  defaults,
}: {
  activeMode: AdminUpdatesMode;
  activeFilter?: UpdateStatus | AdminUpdateFeatureFilter;
  bodyTypes: UpdateBodyType[];
  defaults?: Partial<UpdateFormInput>;
}): string =>
  renderAdminUpdateFormHtml({
    title: "Post Update",
    subtitle: "Create a new car update",
    submitLabel: "Post Update",
    actionPath: "/admin/updates/create",
    stateTitle: "Create Flow",
    brand: defaults?.brand ?? "",
    model: defaults?.model ?? "",
    bodyType: defaults?.bodyType ?? bodyTypes[0],
    year: defaults?.year ?? new Date().getUTCFullYear(),
    description: defaults?.description ?? "",
    postedAt: defaults?.postedAt ?? new Date().toISOString(),
    status: defaults?.status ?? "VISIBLE",
    galleryImageUrls: [],
    currentState: [
      { label: "Status", value: defaults?.status ?? "VISIBLE" },
      { label: "Featured", value: "NO" },
      { label: "Feature request", value: "NONE" },
    ],
    activeMode,
    activeFilter,
    bodyTypes,
  });
