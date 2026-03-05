import type {
  AdminDbFieldSchema,
  AdminDbTableName,
  AdminDbTableSchema,
} from "./service";

const singularTitles: Record<string, string> = {
  car_brands: "brand",
  car_models: "model",
  sellers: "seller",
  seller_access_invites: "access invite",
  seller_access_attempts: "access attempt",
  seller_access_sessions: "access session",
  car_listings: "listing",
  car_updates: "update",
};

const escapeHtml = (value: unknown): string =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatAdminCell = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '<span style="color:#7f8791">null</span>';
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed) || (parsed && typeof parsed === "object")) {
        return `<pre>${escapeHtml(JSON.stringify(parsed, null, 2))}</pre>`;
      }
    } catch {
      return escapeHtml(value);
    }
  }

  return escapeHtml(value);
};

const buildRowDeleteLabel = (row: Record<string, unknown>): string => {
  const name = typeof row.name === "string" ? row.name : "";
  const model = typeof row.model === "string" ? row.model : "";
  const brand = typeof row.brand === "string" ? row.brand : "";
  const phone = typeof row.phone === "string" ? row.phone : "";
  const id = typeof row.id === "string" ? row.id : "this row";

  if (name) {
    return name;
  }
  if (brand || model) {
    return `${brand} ${model}`.trim();
  }
  if (phone) {
    return phone;
  }

  return id;
};

const renderFieldInput = ({
  field,
  value,
  foreignKeyOptions,
}: {
  field: AdminDbFieldSchema;
  value: string;
  foreignKeyOptions: Array<{ value: string; label: string }>;
}): string => {
  if (field.kind === "enum") {
    return `
      <select name="${escapeHtml(field.name)}"${field.required ? " required" : ""}>
        ${field.required ? "" : '<option value=""></option>'}
        ${(field.options ?? [])
          .map(
            (option) => `
              <option value="${escapeHtml(option)}"${option === value ? " selected" : ""}>${escapeHtml(option)}</option>
            `,
          )
          .join("")}
      </select>
    `;
  }

  if (field.kind === "foreignKey") {
    return `
      <select name="${escapeHtml(field.name)}"${field.required ? " required" : ""}>
        ${field.required ? "" : '<option value=""></option>'}
        ${foreignKeyOptions
          .map(
            (option) => `
              <option value="${escapeHtml(option.value)}"${option.value === value ? " selected" : ""}>${escapeHtml(option.label)}</option>
            `,
          )
          .join("")}
      </select>
    `;
  }

  if (field.kind === "json") {
    return `<textarea name="${escapeHtml(field.name)}"${field.required ? " required" : ""}>${escapeHtml(value)}</textarea>`;
  }

  const inputType = field.kind === "number" ? "number" : "text";
  return `<input type="${inputType}" name="${escapeHtml(field.name)}" value="${escapeHtml(value)}"${field.required ? " required" : ""} />`;
};

export const renderAdminDbHtml = ({
  baseUrl,
  selectedTable,
  snapshot,
  tableData,
}: {
  baseUrl: string;
  selectedTable?: string;
  snapshot: {
    tables: Array<{
      name: string;
      count: number;
    }>;
  };
  tableData: {
    primaryKey: string;
    columns: string[];
    rows: Array<Record<string, unknown>>;
    total: number;
    page: number;
    pageSize: number;
    query: string;
  } | null;
}): string => {
  const currentTable = selectedTable ?? snapshot.tables[0]?.name ?? "No tables";
  const currentQuery = tableData?.query ?? "";
  const currentPage = tableData?.page ?? 1;
  const totalPages =
    tableData ? Math.max(1, Math.ceil(tableData.total / tableData.pageSize)) : 1;
  const buildTableHref = (page: number): string =>
    `/admin/db?table=${encodeURIComponent(currentTable as string)}${currentQuery ? `&q=${encodeURIComponent(currentQuery)}` : ""}&page=${page}`;

  const nav = snapshot.tables
    .map(
      (table) => `
        <a
          href="/admin/db?table=${encodeURIComponent(table.name)}"
          class="table-link${table.name === currentTable ? " active" : ""}"
        >
          <span>${escapeHtml(table.name)}</span>
          <strong>${table.count}</strong>
        </a>
      `,
    )
    .join("");

  const headerCells = tableData
    ? `${tableData.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}<th>Actions</th>`
    : "";

  const bodyRows = tableData
    ? tableData.rows
        .map((row) => {
          const rawRowId = row[tableData.primaryKey];
          const rowId = typeof rawRowId === "string" ? rawRowId : "";
          return `
            <tr>
              ${tableData.columns
                .map((column) => `<td>${formatAdminCell(row[column])}</td>`)
                .join("")}
              <td class="actions-cell">
                ${
                  rowId
                    ? `
                        <a class="action-link" href="/admin/db/${encodeURIComponent(currentTable)}/${encodeURIComponent(rowId)}/edit">Edit</a>
                        <form method="post" action="/admin/db/${encodeURIComponent(currentTable)}/${encodeURIComponent(rowId)}/delete">
                          <input type="hidden" name="confirmLabel" value="${escapeHtml(buildRowDeleteLabel(row))}" />
                          <button type="submit" class="delete-button">Delete</button>
                        </form>
                      `
                    : ""
                }
              </td>
            </tr>
          `;
        })
        .join("")
    : "";

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Car Party DB Admin</title>
        <style>
          :root {
            color-scheme: dark;
            --bg: #050608;
            --surface: #0c0f13;
            --surface-alt: #14181d;
            --ink: #f4f4ef;
            --ink-soft: #979da7;
            --primary: #e7d31a;
            --line: #252a32;
            --danger: #d96652;
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            background: var(--bg);
            color: var(--ink);
          }
          .layout {
            display: grid;
            grid-template-columns: 280px 1fr;
            min-height: 100vh;
          }
          .sidebar {
            border-right: 1px solid var(--line);
            background: var(--surface);
            padding: 24px 18px;
          }
          .content {
            padding: 24px;
          }
          h1, h2, p { margin: 0; }
          .subtle {
            color: var(--ink-soft);
            margin-top: 8px;
            margin-bottom: 18px;
          }
          .table-nav {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-top: 22px;
          }
          .table-link {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 14px 16px;
            border-radius: 16px;
            background: var(--surface-alt);
            color: var(--ink);
            text-decoration: none;
            border: 1px solid transparent;
          }
          .table-link.active {
            border-color: var(--primary);
            background: rgba(231, 211, 26, 0.08);
          }
          .table-link strong {
            color: var(--primary);
            font-size: 13px;
          }
          .topbar {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 18px;
          }
          .topbar > div:last-child {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px;
          }
          .home-link {
            margin-left: auto;
          }
          .topbar a {
            color: var(--primary);
            text-decoration: none;
          }
          .force-button,
          .create-link,
          .action-link,
          .cancel-link {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 44px;
            border-radius: 14px;
            padding: 0 16px;
            text-decoration: none;
          }
          .force-button,
          .create-link {
            border: 0;
            background: var(--primary);
            color: #050608;
            font-weight: 800;
            cursor: pointer;
          }
          .panel {
            border: 1px solid var(--line);
            background: var(--surface);
            border-radius: 22px;
            overflow: hidden;
          }
          .panel-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding: 18px 20px;
            border-bottom: 1px solid var(--line);
            background: var(--surface-alt);
          }
          .panel-head-actions {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
          }
          .search-form {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
          }
          .search-form input {
            min-width: 280px;
            min-height: 42px;
            border-radius: 14px;
            border: 1px solid var(--line);
            background: var(--surface);
            color: var(--ink);
            padding: 0 14px;
            font: inherit;
          }
          .search-button,
          .page-link {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 42px;
            border-radius: 14px;
            padding: 0 14px;
            text-decoration: none;
            border: 1px solid var(--line);
            background: var(--surface);
            color: var(--ink);
            font-weight: 700;
          }
          .page-link.disabled {
            opacity: 0.45;
            pointer-events: none;
          }
          .pagination {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
          }
          .table-wrap {
            overflow: auto;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            min-width: 980px;
          }
          th, td {
            padding: 14px 16px;
            border-bottom: 1px solid var(--line);
            text-align: left;
            vertical-align: top;
            font-size: 14px;
          }
          th {
            position: sticky;
            top: 0;
            background: var(--surface-alt);
            color: var(--primary);
            text-transform: uppercase;
            letter-spacing: 0.06em;
            font-size: 12px;
          }
          td {
            color: var(--ink);
          }
          .actions-cell {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
          }
          .action-link {
            min-height: 38px;
            background: var(--surface-alt);
            color: var(--ink);
            border: 1px solid var(--line);
            font-weight: 700;
          }
          .delete-button {
            min-height: 38px;
            border: 0;
            border-radius: 14px;
            background: rgba(217, 102, 82, 0.18);
            color: var(--danger);
            padding: 0 16px;
            font: inherit;
            font-weight: 700;
            cursor: pointer;
          }
          pre {
            margin: 0;
            white-space: pre-wrap;
            word-break: break-word;
            color: var(--ink-soft);
            font: 12px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace;
          }
          @media (max-width: 900px) {
            .layout {
              grid-template-columns: 1fr;
            }
            .sidebar {
              border-right: 0;
              border-bottom: 1px solid var(--line);
            }
            .topbar,
            .panel-head {
              flex-direction: column;
              align-items: stretch;
            }
          }
        </style>
      </head>
      <body>
        <div class="layout">
          <aside class="sidebar">
            <h1>DB Admin</h1>
            <p class="subtle">Full schema CRUD for the local catalog database.</p>
            <div class="table-nav">${nav}</div>
          </aside>
          <main class="content">
            <div class="topbar">
              <div>
                <h2>${escapeHtml(currentTable)}</h2>
                <p class="subtle">Source: ${escapeHtml(baseUrl)}/admin/db</p>
              </div>
              <div>
                ${
                  selectedTable
                    ? `<a class="create-link" href="/admin/db/${encodeURIComponent(currentTable as string)}/create">Add ${escapeHtml(singularTitles[currentTable as string] ?? "row")}</a>`
                    : ""
                }
                <form method="post" action="/admin/catalog/force-refresh" style="display:inline-flex;align-items:center;gap:10px">
                  <input type="hidden" name="returnTo" value="/admin/db${selectedTable ? `?table=${encodeURIComponent(selectedTable)}` : ""}" />
                  <button type="submit" class="force-button">Force update</button>
                </form>
                <a class="home-link" href="/admin">Admin Home</a>
              </div>
            </div>
            <section class="panel">
              <div class="panel-head">
                <span>
                  ${
                    tableData
                      ? `${tableData.total} match(es) · page ${tableData.page} of ${totalPages} · showing ${tableData.rows.length}`
                      : "No data"
                  }
                </span>
                ${
                  selectedTable
                    ? `
                        <div class="panel-head-actions">
                          <form class="search-form" method="get" action="/admin/db">
                            <input type="hidden" name="table" value="${escapeHtml(currentTable)}" />
                            <input
                              type="search"
                              name="q"
                              value="${escapeHtml(currentQuery)}"
                              placeholder="Search this table..."
                            />
                            <input type="hidden" name="page" value="1" />
                            <button type="submit" class="search-button">Search</button>
                          </form>
                          <div class="pagination">
                            <a class="page-link${currentPage <= 1 ? " disabled" : ""}" href="${buildTableHref(Math.max(1, currentPage - 1))}">Previous</a>
                            <a class="page-link${currentPage >= totalPages ? " disabled" : ""}" href="${buildTableHref(Math.min(totalPages, currentPage + 1))}">Next</a>
                          </div>
                        </div>
                      `
                    : ""
                }
              </div>
              <div class="table-wrap">
                ${
                  tableData
                    ? `
                      <table>
                        <thead>
                          <tr>${headerCells}</tr>
                        </thead>
                        <tbody>${bodyRows}</tbody>
                      </table>
                    `
                    : `<div style="padding:24px;color:var(--ink-soft)">No table selected.</div>`
                }
              </div>
            </section>
          </main>
        </div>
        <script>
          (() => {
            const key = "admin-scroll:" + window.location.pathname + window.location.search;
            const savedScroll = window.sessionStorage.getItem(key);
            if (savedScroll) {
              window.sessionStorage.removeItem(key);
              window.requestAnimationFrame(() => {
                window.scrollTo(0, Number(savedScroll));
              });
            }

            document.querySelectorAll("form").forEach((form) => {
              form.addEventListener("submit", (event) => {
                const action = form.getAttribute("action") || "";
                if (action.endsWith("/delete")) {
                  const labelInput = form.querySelector('input[name="confirmLabel"]');
                  const label = labelInput instanceof HTMLInputElement ? labelInput.value : "this row";
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

export const renderAdminDbFormHtml = ({
  table,
  title,
  actionPath,
  schema,
  hiddenFieldNames,
  values,
  foreignKeyOptions,
  errorMessage,
  submitLabel,
  readOnlyFacts,
}: {
  table: AdminDbTableName;
  title: string;
  actionPath: string;
  schema: AdminDbTableSchema;
  hiddenFieldNames?: string[];
  values: Record<string, string>;
  foreignKeyOptions: Record<string, Array<{ value: string; label: string }>>;
  errorMessage?: string;
  submitLabel: string;
  readOnlyFacts?: Array<{ label: string; value: string }>;
}): string => `
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
          --primary: #e7d31a;
          --line: #252a32;
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
          max-width: 980px;
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
        .panel {
          border-radius: 24px;
          border: 1px solid var(--line);
          background: var(--surface);
          padding: 20px;
        }
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
        input, textarea, select, button {
          width: 100%;
          min-height: 46px;
          border-radius: 14px;
          border: 1px solid var(--line);
          background: var(--surface-alt);
          color: var(--ink);
          padding: 0 14px;
          font: inherit;
        }
        textarea {
          min-height: 140px;
          padding: 12px 14px;
          resize: vertical;
        }
        .error {
          border-radius: 16px;
          padding: 14px 16px;
          background: rgba(217, 102, 82, 0.16);
          color: var(--danger);
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
        .cancel-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        @media (max-width: 720px) {
          .topbar,
          .actions {
            flex-direction: column;
            align-items: stretch;
          }
        }
      </style>
    </head>
    <body>
      <main class="page">
        <div class="topbar">
          <div>
            <h1>${escapeHtml(title)}</h1>
            <p class="subtle">${escapeHtml(schema.title)} · ${escapeHtml(table)}</p>
          </div>
          <a href="/admin/db?table=${encodeURIComponent(table)}">Back to table</a>
        </div>
        <section class="panel">
          ${errorMessage ? `<div class="error">${escapeHtml(errorMessage)}</div>` : ""}
          <form method="post" action="${escapeHtml(actionPath)}">
            ${schema.fields
              .filter((field) => !(hiddenFieldNames ?? []).includes(field.name))
              .map(
                (field) => `
                  <label>
                    ${escapeHtml(field.label)}
                    ${renderFieldInput({
                      field,
                      value: values[field.name] ?? "",
                      foreignKeyOptions: foreignKeyOptions[field.name] ?? [],
                    })}
                  </label>
                `,
              )
              .join("")}
            ${
              readOnlyFacts && readOnlyFacts.length > 0
                ? `
                  <div class="facts">
                    ${readOnlyFacts
                      .map(
                        (fact) => `
                          <div class="fact">
                            <span>${escapeHtml(fact.label)}</span>
                            <strong>${escapeHtml(fact.value)}</strong>
                          </div>
                        `,
                      )
                      .join("")}
                  </div>
                `
                : ""
            }
            <div class="actions">
              <button type="submit" class="primary">${escapeHtml(submitLabel)}</button>
              <a class="cancel-link" href="/admin/db?table=${encodeURIComponent(table)}">Cancel</a>
            </div>
          </form>
        </section>
      </main>
    </body>
  </html>
`;
