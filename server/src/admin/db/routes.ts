import type { IncomingMessage, ServerResponse } from "node:http";

import {
  createAdminDbRow,
  deleteAdminDbRow,
  getAdminDbFieldDisplayValue,
  getAdminDbRow,
  getAdminDbSnapshot,
  getAdminDbTableData,
  getAdminDbTablePrimaryKey,
  getAdminDbTableSchema,
  getAdminDbTableSingularTitle,
  getAdminDbTableTitle,
  isAdminDbTableName,
  updateAdminDbRow,
} from "./service";
import { renderAdminDbFormHtml, renderAdminDbHtml } from "./view";

const readFormBody = async (req: IncomingMessage): Promise<URLSearchParams> => {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
};

const redirect = (res: ServerResponse, location: string): void => {
  res.writeHead(303, {
    Location: location,
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store",
  });
  res.end();
};

export const handleAdminDbRequest = async ({
  req,
  res,
  requestUrl,
  baseUrl,
  writeHtml,
  writeJson,
}: {
  req: IncomingMessage;
  res: ServerResponse;
  requestUrl: URL;
  baseUrl: string;
  writeHtml: (res: ServerResponse, statusCode: number, payload: string) => void;
  writeJson: (res: ServerResponse, statusCode: number, payload: unknown) => void;
}): Promise<boolean> => {
  if (req.method === "GET" && requestUrl.pathname === "/admin/db") {
    const snapshot = getAdminDbSnapshot();
    const selectedTable = requestUrl.searchParams.get("table") ?? undefined;
    const query = requestUrl.searchParams.get("q") ?? "";
    const page = Number(requestUrl.searchParams.get("page") ?? "1");
    const currentTable =
      selectedTable && isAdminDbTableName(selectedTable)
        ? selectedTable
        : snapshot.tables[0]?.name;

    writeHtml(
      res,
      200,
      renderAdminDbHtml({
        baseUrl,
        selectedTable: currentTable,
        snapshot,
        tableData:
          currentTable
            ? getAdminDbTableData(currentTable, {
                query,
                page,
                pageSize: 100,
              })
            : null,
      }),
    );
    return true;
  }

  const createMatch = requestUrl.pathname.match(/^\/admin\/db\/([^/]+)\/create$/);

  if (req.method === "GET" && createMatch) {
    const table = decodeURIComponent(createMatch[1]);
    if (!isAdminDbTableName(table)) {
      writeJson(res, 404, { code: "TABLE_NOT_FOUND", message: "Table not found." });
      return true;
    }

    const { schema, foreignKeyOptions } = getAdminDbTableSchema(table);
    const primaryKeyLabel =
      schema.fields.find((field) => field.name === schema.primaryKey)?.label ??
      getAdminDbTablePrimaryKey(table);
    writeHtml(
      res,
      200,
      renderAdminDbFormHtml({
        table,
        title: `Add ${getAdminDbTableSingularTitle(table)}`,
        actionPath: `/admin/db/${encodeURIComponent(table)}/create`,
        schema,
        hiddenFieldNames: schema.primaryKey === "id" ? ["id"] : [],
        values: Object.fromEntries(schema.fields.map((field) => [field.name, ""])),
        foreignKeyOptions,
        submitLabel: `Add ${getAdminDbTableSingularTitle(table)}`,
      }),
    );
    return true;
  }

  if (req.method === "POST" && createMatch) {
    const table = decodeURIComponent(createMatch[1]);
    if (!isAdminDbTableName(table)) {
      writeJson(res, 404, { code: "TABLE_NOT_FOUND", message: "Table not found." });
      return true;
    }

    const body = await readFormBody(req);
    const fields = Object.fromEntries(body.entries());

    try {
      createAdminDbRow(table, fields);
      redirect(res, `/admin/db?table=${encodeURIComponent(table)}`);
    } catch (error) {
      const { schema, foreignKeyOptions } = getAdminDbTableSchema(table);
      writeHtml(
        res,
        400,
        renderAdminDbFormHtml({
          table,
          title: `Add ${getAdminDbTableSingularTitle(table)}`,
          actionPath: `/admin/db/${encodeURIComponent(table)}/create`,
          schema,
          hiddenFieldNames: schema.primaryKey === "id" ? ["id"] : [],
          values: fields,
          foreignKeyOptions,
          errorMessage: error instanceof Error ? error.message : "Failed to create row.",
          submitLabel: `Add ${getAdminDbTableSingularTitle(table)}`,
        }),
      );
    }
    return true;
  }

  const editMatch = requestUrl.pathname.match(/^\/admin\/db\/([^/]+)\/([^/]+)\/edit$/);

  if (req.method === "GET" && editMatch) {
    const table = decodeURIComponent(editMatch[1]);
    const rowId = decodeURIComponent(editMatch[2]);
    if (!isAdminDbTableName(table)) {
      writeJson(res, 404, { code: "TABLE_NOT_FOUND", message: "Table not found." });
      return true;
    }

    const row = getAdminDbRow(table, rowId);
    if (!row) {
      writeJson(res, 404, { code: "ROW_NOT_FOUND", message: "Row not found." });
      return true;
    }

    const { schema, foreignKeyOptions } = getAdminDbTableSchema(table);
    const primaryKeyLabel =
      schema.fields.find((field) => field.name === schema.primaryKey)?.label ??
      getAdminDbTablePrimaryKey(table);
    writeHtml(
      res,
      200,
      renderAdminDbFormHtml({
        table,
        title: `Edit ${getAdminDbTableSingularTitle(table)}`,
        actionPath: `/admin/db/${encodeURIComponent(table)}/${encodeURIComponent(rowId)}/update`,
        schema,
        hiddenFieldNames: [schema.primaryKey],
        values: Object.fromEntries(
          schema.fields.map((field) => [field.name, getAdminDbFieldDisplayValue(row, field)]),
        ),
        foreignKeyOptions,
        submitLabel: `Save ${getAdminDbTableSingularTitle(table)}`,
        readOnlyFacts: [{ label: primaryKeyLabel, value: rowId }],
      }),
    );
    return true;
  }

  const updateMatch = requestUrl.pathname.match(/^\/admin\/db\/([^/]+)\/([^/]+)\/update$/);

  if (req.method === "POST" && updateMatch) {
    const table = decodeURIComponent(updateMatch[1]);
    const rowId = decodeURIComponent(updateMatch[2]);
    if (!isAdminDbTableName(table)) {
      writeJson(res, 404, { code: "TABLE_NOT_FOUND", message: "Table not found." });
      return true;
    }

    const body = await readFormBody(req);
    const fields = Object.fromEntries(body.entries());

    try {
      const didUpdate = updateAdminDbRow(table, rowId, fields);
      if (!didUpdate) {
      writeJson(res, 404, { code: "ROW_NOT_FOUND", message: "Row not found." });
      return true;
    }
      redirect(res, `/admin/db?table=${encodeURIComponent(table)}`);
    } catch (error) {
      const { schema, foreignKeyOptions } = getAdminDbTableSchema(table);
      const primaryKeyLabel =
        schema.fields.find((field) => field.name === schema.primaryKey)?.label ??
        getAdminDbTablePrimaryKey(table);
      writeHtml(
        res,
        400,
        renderAdminDbFormHtml({
          table,
          title: `Edit ${getAdminDbTableSingularTitle(table)}`,
          actionPath: `/admin/db/${encodeURIComponent(table)}/${encodeURIComponent(rowId)}/update`,
          schema,
          hiddenFieldNames: [schema.primaryKey],
          values: fields,
          foreignKeyOptions,
          errorMessage: error instanceof Error ? error.message : "Failed to update row.",
          submitLabel: `Save ${getAdminDbTableSingularTitle(table)}`,
          readOnlyFacts: [{ label: primaryKeyLabel, value: rowId }],
        }),
      );
    }
    return true;
  }

  const deleteMatch = requestUrl.pathname.match(/^\/admin\/db\/([^/]+)\/([^/]+)\/delete$/);

  if (req.method === "POST" && deleteMatch) {
    const table = decodeURIComponent(deleteMatch[1]);
    const rowId = decodeURIComponent(deleteMatch[2]);
    if (!isAdminDbTableName(table)) {
      writeJson(res, 404, { code: "TABLE_NOT_FOUND", message: "Table not found." });
      return true;
    }

    try {
      const didDelete = deleteAdminDbRow(table, rowId);
      if (!didDelete) {
        writeJson(res, 404, { code: "ROW_NOT_FOUND", message: "Row not found." });
        return true;
      }
      redirect(res, `/admin/db?table=${encodeURIComponent(table)}`);
    } catch (error) {
      writeJson(res, 400, {
        code: "DELETE_FAILED",
        message: error instanceof Error ? error.message : "Failed to delete row.",
      });
    }
    return true;
  }

  return false;
};
