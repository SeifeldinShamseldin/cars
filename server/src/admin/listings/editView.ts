import type { ListingStatus } from "./service";
import type {
  AdminListingRecord,
  AdminListingsMode,
  ListingEditorOptions,
} from "./service";

const escapeHtml = (value: unknown): string =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const buildListingsAdminLocation = ({
  mode,
  filter,
}: {
  mode: AdminListingsMode;
  filter?: ListingStatus;
}): string => {
  const search = new URLSearchParams();

  if (mode === "FEATURED") {
    search.set("mode", mode);
  }
  if (filter) {
    search.set("filter", filter);
  }

  const query = search.toString();
  return query.length > 0 ? `/admin/listings?${query}` : "/admin/listings";
};

const renderSelectOptions = (
  values: string[],
  selectedValue: string,
): string =>
  values
    .map(
      (value) => `
        <option value="${escapeHtml(value)}"${value === selectedValue ? " selected" : ""}>
          ${escapeHtml(value)}
        </option>
      `,
    )
    .join("");

export const renderAdminListingEditHtml = ({
  listing,
  activeMode,
  activeFilter,
  options,
}: {
  listing: AdminListingRecord;
  activeMode: AdminListingsMode;
  activeFilter?: ListingStatus;
  options: ListingEditorOptions;
}): string => {
  const normalizedBrandKey = listing.brand.toLowerCase();
  const modelGroups = options.referenceCatalog.modelGroupsByBrand[normalizedBrandKey] ?? [];
  const initialModels = modelGroups.flatMap((group) => group.models);
  const returnTo = buildListingsAdminLocation({
    mode: activeMode,
    filter: activeFilter,
  });

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Edit Sell Listing</title>
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
          h1, h2, h3, p { margin-top: 0; }
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
          .grid-2 {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
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
            min-width: 120px;
            color: var(--ink-soft);
          }
          .existing-gallery-row img {
            width: 120px;
            height: 82px;
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
          .image-order {
            display: grid;
            gap: 6px;
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
            .grid-2,
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
              <h1>Edit Sell Listing</h1>
              <p class="subtle">${escapeHtml(listing.brand)} ${escapeHtml(listing.model)} · ${escapeHtml(listing.id)}</p>
            </div>
            <a href="${escapeHtml(returnTo)}">Back to listings</a>
          </div>

          <div class="layout">
            <section class="panel">
              <form
                method="post"
                action="/admin/listings/${encodeURIComponent(listing.id)}/update"
                enctype="multipart/form-data"
              >
                <input type="hidden" name="mode" value="${escapeHtml(activeMode)}" />
                ${activeFilter ? `<input type="hidden" name="filter" value="${escapeHtml(activeFilter)}" />` : ""}

                <div class="grid-2">
                  <label>
                    Brand
                    <select name="brand" id="brandSelect" required>
                      ${renderSelectOptions(options.referenceCatalog.brands, listing.brand)}
                    </select>
                  </label>
                  <label>
                    Model
                    <select name="model" id="modelSelect" required data-current-model="${escapeHtml(listing.model)}">
                      ${renderSelectOptions(initialModels, listing.model)}
                    </select>
                  </label>
                </div>

                <div class="grid-2">
                  <label>
                    Seller name
                    <input name="sellerName" required value="${escapeHtml(listing.sellerName)}" />
                  </label>
                  <label>
                    Telephone
                    <input name="telephone" required value="${escapeHtml(listing.telephone)}" />
                  </label>
                </div>

                <div class="grid-2">
                  <label>
                    Seller type
                    <select name="sellerType" required>
                      ${renderSelectOptions(options.sellerTypes, listing.sellerType)}
                    </select>
                  </label>
                  <label>
                    Body type
                    <select name="bodyType" required>
                      ${renderSelectOptions(options.bodyTypes, listing.bodyType)}
                    </select>
                  </label>
                </div>

                <div class="grid-2">
                  <label>
                    Year
                    <input type="number" name="year" min="1900" max="2100" required value="${escapeHtml(listing.year)}" />
                  </label>
                  <label>
                    Price
                    <input type="number" name="priceValue" min="0" step="1" required value="${escapeHtml(listing.priceValue)}" />
                  </label>
                </div>

                <div class="grid-2">
                  <label>
                    Condition
                    <select name="condition" required>
                      ${renderSelectOptions(options.conditions, listing.condition)}
                    </select>
                  </label>
                  <label>
                    Fuel type
                    <select name="fuelType" required>
                      ${renderSelectOptions(options.fuelTypes, listing.fuelType)}
                    </select>
                  </label>
                </div>

                <div class="grid-2">
                  <label>
                    Transmission
                    <select name="transmission" required>
                      ${renderSelectOptions(options.transmissions, listing.transmission)}
                    </select>
                  </label>
                  <label>
                    Mileage
                    <input type="number" name="mileage" min="0" step="1" required value="${escapeHtml(listing.mileage)}" />
                  </label>
                </div>

                <div class="grid-2">
                  <label>
                    Rim size inches
                    <input type="number" name="rimSizeInches" min="1" step="1" required value="${escapeHtml(listing.rimSizeInches)}" />
                  </label>
                  <label>
                    Color
                    <input name="color" required value="${escapeHtml(listing.color)}" />
                  </label>
                </div>

                <div class="grid-2">
                  <label>
                    Negotiable
                    <select name="isNegotiable" required>
                      ${renderSelectOptions(options.yesNoOptions, listing.isNegotiable)}
                    </select>
                  </label>
                  <label>
                    Accident history
                    <select name="accidentHistory" required>
                      ${renderSelectOptions(options.yesNoOptions, listing.accidentHistory)}
                    </select>
                  </label>
                </div>

                <label>
                  Posted at
                  <input name="postedAt" required value="${escapeHtml(listing.postedAt)}" />
                </label>

                <label>
                  Description
                  <textarea name="description" required>${escapeHtml(listing.description)}</textarea>
                </label>

                <div class="existing-gallery">
                  <span>Current gallery</span>
                  ${
                    listing.galleryImageUrls.length > 0
                      ? `
                        <div class="existing-gallery-row">
                          ${listing.galleryImageUrls
                            .map(
                              (imageUrl, index) => `
                                <label class="existing-image-card">
                                  <img src="${escapeHtml(imageUrl)}" alt="Listing image ${index + 1}" />
                                  <span class="image-order">
                                    Order
                                    <select name="imageOrder-${index}">
                                      ${Array.from({ length: listing.galleryImageUrls.length }, (_, orderIndex) => orderIndex + 1)
                                        .map(
                                          (orderValue) => `
                                            <option value="${orderValue}"${orderValue === index + 1 ? " selected" : ""}>
                                              ${orderValue}
                                            </option>
                                          `,
                                        )
                                        .join("")}
                                    </select>
                                  </span>
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
                  <button type="submit" class="primary">Save Listing</button>
                  <a class="secondary" href="${escapeHtml(returnTo)}">Cancel</a>
                </div>
              </form>
            </section>

            <aside class="panel">
              <h2>Current State</h2>
              <div class="facts">
                <div class="fact"><span>Status</span><strong>${escapeHtml(listing.status)}</strong></div>
                <div class="fact"><span>Featured</span><strong>${listing.isFeatured ? "YES" : "NO"}</strong></div>
                <div class="fact"><span>Feature request</span><strong>${escapeHtml(listing.featuredRequestStatus)}</strong></div>
              </div>
            </aside>
          </div>
        </main>

        <script>
          (() => {
            const referenceCatalog = ${JSON.stringify(options.referenceCatalog)};
            const brandSelect = document.getElementById("brandSelect");
            const modelSelect = document.getElementById("modelSelect");
            if (!(brandSelect instanceof HTMLSelectElement) || !(modelSelect instanceof HTMLSelectElement)) {
              return;
            }

            const updateModels = (selectedModel) => {
              const brandKey = brandSelect.value.toLowerCase();
              const groups = referenceCatalog.modelGroupsByBrand[brandKey] || [];
              const models = groups.flatMap((group) => group.models);
              modelSelect.innerHTML = models
                .map((model) => '<option value="' + model.replace(/"/g, '&quot;') + '"' + (model === selectedModel ? ' selected' : '') + '>' + model + '</option>')
                .join("");
            };

            updateModels(modelSelect.dataset.currentModel || modelSelect.value);
            brandSelect.addEventListener("change", () => {
              updateModels("");
            });
          })();
        </script>
      </body>
    </html>
  `;
};

export const renderAdminListingCreateHtml = ({
  activeMode,
  activeFilter,
  options,
}: {
  activeMode: AdminListingsMode;
  activeFilter?: ListingStatus;
  options: ListingEditorOptions;
}): string => {
  const defaultBrand = options.referenceCatalog.brands[0] ?? "";
  const defaultBrandKey = defaultBrand.toLowerCase();
  const defaultModelGroups = options.referenceCatalog.modelGroupsByBrand[defaultBrandKey] ?? [];
  const defaultModels = defaultModelGroups.flatMap((group) => group.models);
  const defaultModel = defaultModels[0] ?? "";
  const returnTo = buildListingsAdminLocation({
    mode: activeMode,
    filter: activeFilter,
  });

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Post Sell Listing</title>
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
          h1, h2, h3, p { margin-top: 0; }
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
          .grid-2 {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
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
            .grid-2,
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
              <h1>Post Sell Listing</h1>
              <p class="subtle">Create a new approved sell listing</p>
            </div>
            <a href="${escapeHtml(returnTo)}">Back to listings</a>
          </div>

          <div class="layout">
            <section class="panel">
              <form method="post" action="/admin/listings/create" enctype="multipart/form-data">
                <input type="hidden" name="mode" value="${escapeHtml(activeMode)}" />
                ${activeFilter ? `<input type="hidden" name="filter" value="${escapeHtml(activeFilter)}" />` : ""}

                <div class="grid-2">
                  <label>
                    Brand
                    <select name="brand" id="brandSelect" required>
                      ${renderSelectOptions(options.referenceCatalog.brands, defaultBrand)}
                    </select>
                  </label>
                  <label>
                    Model
                    <select name="model" id="modelSelect" required data-current-model="${escapeHtml(defaultModel)}">
                      ${renderSelectOptions(defaultModels, defaultModel)}
                    </select>
                  </label>
                </div>

                <div class="grid-2">
                  <label>
                    Seller name
                    <input name="sellerName" required />
                  </label>
                  <label>
                    Telephone
                    <input name="telephone" required />
                  </label>
                </div>

                <div class="grid-2">
                  <label>
                    Seller type
                    <select name="sellerType" required>
                      ${renderSelectOptions(options.sellerTypes, options.sellerTypes[0])}
                    </select>
                  </label>
                  <label>
                    Body type
                    <select name="bodyType" required>
                      ${renderSelectOptions(options.bodyTypes, options.bodyTypes[0])}
                    </select>
                  </label>
                </div>

                <div class="grid-2">
                  <label>
                    Year
                    <input type="number" name="year" min="1900" max="2100" required value="${escapeHtml(new Date().getUTCFullYear())}" />
                  </label>
                  <label>
                    Price
                    <input type="number" name="priceValue" min="0" step="1" required />
                  </label>
                </div>

                <div class="grid-2">
                  <label>
                    Condition
                    <select name="condition" required>
                      ${renderSelectOptions(options.conditions, options.conditions[0])}
                    </select>
                  </label>
                  <label>
                    Fuel type
                    <select name="fuelType" required>
                      ${renderSelectOptions(options.fuelTypes, options.fuelTypes[0])}
                    </select>
                  </label>
                </div>

                <div class="grid-2">
                  <label>
                    Transmission
                    <select name="transmission" required>
                      ${renderSelectOptions(options.transmissions, options.transmissions[0])}
                    </select>
                  </label>
                  <label>
                    Mileage
                    <input type="number" name="mileage" min="0" step="1" required value="0" />
                  </label>
                </div>

                <div class="grid-2">
                  <label>
                    Rim size inches
                    <input type="number" name="rimSizeInches" min="1" step="1" required value="18" />
                  </label>
                  <label>
                    Color
                    <input name="color" required />
                  </label>
                </div>

                <div class="grid-2">
                  <label>
                    Negotiable
                    <select name="isNegotiable" required>
                      ${renderSelectOptions(options.yesNoOptions, options.yesNoOptions[0])}
                    </select>
                  </label>
                  <label>
                    Accident history
                    <select name="accidentHistory" required>
                      ${renderSelectOptions(options.yesNoOptions, options.yesNoOptions[1])}
                    </select>
                  </label>
                </div>

                <label>
                  Posted at
                  <input name="postedAt" required value="${escapeHtml(new Date().toISOString())}" />
                </label>

                <label>
                  Description
                  <textarea name="description" required></textarea>
                </label>

                <label>
                  Upload images
                  <input name="images" type="file" accept="image/*" multiple />
                </label>

                <div class="actions">
                  <button type="submit" class="primary">Post Listing</button>
                  <a class="secondary" href="${escapeHtml(returnTo)}">Cancel</a>
                </div>
              </form>
            </section>

            <aside class="panel">
              <h2>Create Flow</h2>
              <div class="facts">
                <div class="fact"><span>Status</span><strong>APPROVED</strong></div>
                <div class="fact"><span>Featured</span><strong>NO</strong></div>
                <div class="fact"><span>Feature request</span><strong>NONE</strong></div>
              </div>
            </aside>
          </div>
        </main>

        <script>
          (() => {
            const referenceCatalog = ${JSON.stringify(options.referenceCatalog)};
            const brandSelect = document.getElementById("brandSelect");
            const modelSelect = document.getElementById("modelSelect");
            if (!(brandSelect instanceof HTMLSelectElement) || !(modelSelect instanceof HTMLSelectElement)) {
              return;
            }

            const escapeOptionValue = (value) =>
              value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

            const updateModels = (selectedModel) => {
              const brandKey = brandSelect.value.toLowerCase();
              const groups = referenceCatalog.modelGroupsByBrand[brandKey] || [];
              const models = groups.flatMap((group) => group.models);
              modelSelect.innerHTML = models
                .map((model, index) => '<option value="' + escapeOptionValue(model) + '"' + ((model === selectedModel || (!selectedModel && index === 0)) ? ' selected' : '') + '>' + model + '</option>')
                .join("");
            };

            updateModels(modelSelect.dataset.currentModel || modelSelect.value);
            brandSelect.addEventListener("change", () => {
              updateModels("");
            });
          })();
        </script>
      </body>
    </html>
  `;
};
