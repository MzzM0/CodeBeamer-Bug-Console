const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 3080);
const HOST = "127.0.0.1";
const ROOT_DIR = process.cwd();
const SESSION_TTL_MS = 15000;
const SHUTDOWN_CHECK_MS = 5000;
const CLIENT_ONLY_FIELD_NAMES = new Set();
const CODEBEAMER_WIKI_TEXT_STYLE = "font-family:Arial;font-size:10pt;color:rgb(30,30,30);";

const sessions = new Map();

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".log": "text/plain; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

const server = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);

    if (requestUrl.pathname.startsWith("/api/")) {
      await handleApiRequest(req, res, requestUrl);
      return;
    }

    await serveStatic(req, res, requestUrl);
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : "未知服务端错误",
    });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Server listening at http://${HOST}:${PORT}`);
});

setInterval(() => {
  pruneExpiredSessions();
}, SHUTDOWN_CHECK_MS);

async function handleApiRequest(req, res, requestUrl) {
  if (req.method === "GET" && requestUrl.pathname === "/api/health") {
    sendJson(res, 200, {
      ok: true,
      serverTime: new Date().toISOString(),
      activeSessions: sessions.size,
    });
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "仅支持 POST 请求" });
    return;
  }

  const body = await readJsonBody(req);

  if (requestUrl.pathname === "/api/session/start") {
    const sessionId = createSession();
    sendJson(res, 200, { sessionId });
    return;
  }

  if (requestUrl.pathname === "/api/session/heartbeat") {
    const sessionId = String(body.sessionId || "");
    if (!sessionId || !sessions.has(sessionId)) {
      sendJson(res, 400, { error: "无效 sessionId" });
      return;
    }
    touchSession(sessionId);
    sendJson(res, 200, { ok: true });
    return;
  }

  if (requestUrl.pathname === "/api/session/stop") {
    const sessionId = String(body.sessionId || "");
    if (sessionId) {
      sessions.delete(sessionId);
    }
    sendJson(res, 200, { ok: true });
    return;
  }

  const auth = buildAuthConfig(body);

  if (requestUrl.pathname === "/api/projects") {
    const projects = await cbFetchJson(auth, "/api/v3/projects");
    sendJson(res, 200, {
      projects: Array.isArray(projects) ? projects : [],
    });
    return;
  }

  if (requestUrl.pathname === "/api/trackers") {
    const projectId = Number(body.projectId);
    if (!projectId) {
      sendJson(res, 400, { error: "缺少 projectId" });
      return;
    }

    const nameIncludes = String(body.nameIncludes || "").trim().toLowerCase();
    const bugTrackersOnly = body.bugTrackersOnly === true;
    const trackers = await cbFetchJson(auth, `/api/v3/projects/${projectId}/trackers`);
    const filtered = (Array.isArray(trackers) ? trackers : []).filter((tracker) => {
      if (bugTrackersOnly && !isBugTracker(tracker)) return false;
      if (!nameIncludes) return true;
      return String(tracker.name || "").toLowerCase().includes(nameIncludes);
    });

    sendJson(res, 200, { trackers: filtered });
    return;
  }

  if (requestUrl.pathname === "/api/release-items") {
    const projectId = Number(body.projectId);
    if (!projectId) {
      sendJson(res, 400, { error: "缺少 projectId" });
      return;
    }

    const trackers = await cbFetchJson(auth, `/api/v3/projects/${projectId}/trackers`);
    const releaseTracker = (Array.isArray(trackers) ? trackers : []).find((tracker) => {
      const name = String(tracker.name || "").toLowerCase();
      return name.includes("releases") || name.includes("release");
    });

    if (!releaseTracker) {
      sendJson(res, 200, { tracker: null, items: [] });
      return;
    }

    const data = await cbFetchJson(auth, `/api/v3/trackers/${releaseTracker.id}/items?page=1&pageSize=200`);
    const items = Array.isArray(data.itemRefs) ? data.itemRefs : [];
    sendJson(res, 200, {
      tracker: releaseTracker,
      items,
    });
    return;
  }

  if (requestUrl.pathname === "/api/bug-approvers") {
    const projectId = Number(body.projectId);
    if (!projectId) {
      sendJson(res, 400, { error: "缺少 projectId" });
      return;
    }

    const members = await cbFetchJson(auth, `/rest/project/${projectId}/members`);
    const items = (Array.isArray(members) ? members : [])
      .filter((entry) => {
        const roles = Array.isArray(entry.roles) ? entry.roles : [];
        return roles.some((role) => String(role.name || "").includes("110_Project Change Control Board(CCB)"));
      })
      .map((entry) => ({
        id: entry.member?.id,
        name: entry.member?.email || entry.member?.name || String(entry.member?.id || ""),
        email: entry.member?.email || "",
      }))
      .filter((item) => item.id || item.name);

    const unique = [];
    const seen = new Set();
    for (const item of items) {
      const key = `${item.id}|${item.name}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item);
      }
    }

    sendJson(res, 200, { items: unique });
    return;
  }

  if (requestUrl.pathname === "/api/project-members") {
    const projectId = Number(body.projectId);
    if (!projectId) {
      sendJson(res, 400, { error: "缂哄皯 projectId" });
      return;
    }

    const members = await cbFetchJson(auth, `/rest/project/${projectId}/members`);
    const items = (Array.isArray(members) ? members : [])
      .map((entry) => ({
        id: entry.member?.id,
        name: entry.member?.email || entry.member?.name || String(entry.member?.id || ""),
        email: entry.member?.email || "",
      }))
      .filter((item) => item.id || item.name);

    const unique = [];
    const seen = new Set();
    for (const item of items) {
      const key = `${item.id}|${item.name}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item);
      }
    }

    sendJson(res, 200, { items: unique });
    return;
  }

  if (requestUrl.pathname === "/api/my-bugs") {
    const dashboard = await loadMyBugsDashboard(auth);
    sendJson(res, 200, dashboard);
    return;
  }

  if (requestUrl.pathname === "/api/current-user") {
    const user = await cbFetchJson(auth, "/rest/user/self");
    sendJson(res, 200, {
      user: user && typeof user === "object" ? user : null,
    });
    return;
  }

  if (requestUrl.pathname === "/api/field-options") {
    const trackerId = Number(body.trackerId);
    const fieldName = String(body.fieldName || "").trim();
    if (!trackerId || !fieldName) {
      sendJson(res, 400, { error: "缺少 trackerId 或 fieldName" });
      return;
    }

    const trackerFields = await cbFetchJson(auth, `/api/v3/trackers/${trackerId}/fields`);
    const matchedField = (Array.isArray(trackerFields) ? trackerFields : []).find(
      (field) => String(field.name || "").trim().toLowerCase() === fieldName.toLowerCase(),
    );

    if (!matchedField?.id) {
      sendJson(res, 200, { field: null, items: [] });
      return;
    }

    const fieldDefinition = await cbFetchJson(auth, `/api/v3/trackers/${trackerId}/fields/${matchedField.id}`);
    sendJson(res, 200, {
      field: fieldDefinition,
      items: Array.isArray(fieldDefinition.options) ? fieldDefinition.options : [],
    });
    return;
  }

  if (requestUrl.pathname === "/api/bugs/selected") {
    const trackerId = Number(body.trackerId);
    const projectId = Number(body.projectId);
    const itemIds = [...new Set((Array.isArray(body.itemIds) ? body.itemIds : []).map(Number).filter(Number.isInteger))];
    if (!trackerId || !projectId) {
      sendJson(res, 400, { error: "\u7f3a\u5c11 projectId \u6216 trackerId" });
      return;
    }
    if (!itemIds.length) {
      sendJson(res, 400, { error: "\u8bf7\u81f3\u5c11\u9009\u62e9\u4e00\u6761 Bug" });
      return;
    }
    if (itemIds.length > 200) {
      sendJson(res, 400, { error: "\u4e00\u6b21\u6700\u591a\u5e26\u5165 200 \u6761 Bug" });
      return;
    }

    const payload = await loadTrackerBugDataset(auth, trackerId, itemIds);
    if (Number(payload.tracker?.project?.id) !== projectId) {
      sendJson(res, 400, { error: "\u6240\u9009 Tracker \u4e0d\u5c5e\u4e8e\u6307\u5b9a\u9879\u76ee" });
      return;
    }
    sendJson(res, 200, payload.dataset);
    return;
  }

  if (requestUrl.pathname === "/api/bugs") {
    const trackerId = Number(body.trackerId);
    if (!trackerId) {
      sendJson(res, 400, { error: "\u7f3a\u5c11 trackerId" });
      return;
    }

    const itemRefs = await fetchAllTrackerItemRefs(auth, trackerId);
    const payload = await loadTrackerBugDataset(auth, trackerId, itemRefs.map((item) => item.id), itemRefs);
    sendJson(res, 200, payload.dataset);
    return;
  }

  if (requestUrl.pathname === "/api/transition") {
    const trackerId = Number(body.trackerId);
    const transition = body.transition && typeof body.transition === "object" ? body.transition : {};
    const items = Array.isArray(body.items) ? body.items : [];

    if (!trackerId) {
      sendJson(res, 400, { error: "缺少 trackerId" });
      return;
    }

    if (!transition.fromStatus || !transition.toStatus) {
      sendJson(res, 400, { error: "缺少 transition.fromStatus 或 transition.toStatus" });
      return;
    }

    if (!items.length) {
      sendJson(res, 400, { error: "缺少待流转的 items" });
      return;
    }

    const normalizedTransition = {
      ...transition,
      fromStatus: normalizeTransitionStatusName(transition.fromStatus),
      toStatus: normalizeTransitionStatusName(transition.toStatus),
    };

    const results = await executeTransition(auth, trackerId, normalizedTransition, items);
    const successCount = results.filter((item) => item.ok).length;
    const failedCount = results.length - successCount;

    sendJson(res, 200, {
      ok: failedCount === 0,
      executedAt: new Date().toISOString(),
      summary:
        failedCount === 0
          ? `实际流转成功：${successCount} / ${results.length} 条 Bug 已提交并回读验证通过。`
          : `实际流转完成，但存在失败项：成功 ${successCount} 条，失败 ${failedCount} 条。`,
      transition: normalizedTransition,
      trackerId,
      successCount,
      failedCount,
      results,
    });
    return;
  }

  sendJson(res, 404, { error: "未知 API 路径" });
}

function normalizeTransitionStatusName(statusName) {
  const value = String(statusName || "").trim();
  return value.toLowerCase() === "implmenting" ? "Implementing" : value;
}

function normalizeComparableStatusName(statusName) {
  const value = String(statusName || "").trim().toLowerCase();
  if (value === "implmenting" || value === "implementing") return "implementing";
  if (value === "close" || value === "closed") return "closed";
  return value;
}

async function executeTransition(auth, trackerId, transition, items) {
  const trackerFields = await cbFetchJson(auth, `/api/v3/trackers/${trackerId}/fields`);
  const trackerFieldMap = new Map(
    (Array.isArray(trackerFields) ? trackerFields : []).map((field) => [String(field.name || "").trim(), field]),
  );

  const allFieldNames = new Set(["Status"]);
  items.forEach((item) => {
    Object.keys(item.fieldUpdates || {}).forEach((fieldName) => {
      if (fieldName && !CLIENT_ONLY_FIELD_NAMES.has(fieldName)) {
        allFieldNames.add(fieldName);
      }
    });
  });

  const fieldDefinitionsByName = new Map();
  for (const fieldName of allFieldNames) {
    const trackerField = trackerFieldMap.get(fieldName);
    if (!trackerField?.id) {
      throw new Error(`未在 Tracker ${trackerId} 中找到字段：${fieldName}`);
    }

    const fieldDefinition = await cbFetchJson(auth, `/api/v3/trackers/${trackerId}/fields/${trackerField.id}`);
    fieldDefinitionsByName.set(fieldName, fieldDefinition);
  }

  const optionCache = new Map();
  const results = [];

  for (const item of items) {
    const requestBody = { fieldValues: [] };
    let commentAction = null;
    try {
      if (String(item.comment || "").trim()) {
        commentAction = await createItemComment(auth, Number(item.id), item.comment);
        if (!commentAction.ok) {
          results.push({
            id: item.id,
            summary: item.summary || "",
            ok: false,
            request: {
              endpoint: `/api/v3/items/${item.id}/fields`,
              method: "PUT",
              body: requestBody,
            },
            commentAction,
            response: null,
            error: `Comment 添加失败：${commentAction.error || "未知错误"}`,
          });
          continue;
        }
      }

      requestBody.fieldValues = await buildTransitionFieldPatch(
        auth,
        Number(item.id),
        transition.toStatus,
        item.fieldUpdates || {},
        fieldDefinitionsByName,
        optionCache,
      );

      const patchResponse = await cbRequest(auth, `/api/v3/items/${item.id}/fields`, {
        method: "PUT",
        body: requestBody,
      });

      if (!patchResponse.ok) {
        results.push({
          id: item.id,
          summary: item.summary || "",
          ok: false,
          commentAction,
          request: {
            endpoint: `/api/v3/items/${item.id}/fields`,
            method: "PUT",
            body: requestBody,
          },
          response: {
            statusCode: patchResponse.status,
            body: patchResponse.data ?? patchResponse.text,
          },
          error: `CodeBeamer 返回 ${patchResponse.status}`,
        });
        continue;
      }

      const readbackItem = await cbFetchJson(auth, `/api/v3/items/${item.id}`);
      const readbackFields = await cbFetchJson(auth, `/api/v3/items/${item.id}/fields`);
      const readbackComments = commentAction?.ok
        ? await cbFetchJson(auth, `/api/v3/items/${item.id}/comments`)
        : [];
      const verification = verifyTransitionResult(readbackItem, readbackFields, transition.toStatus, item.fieldUpdates || {});
      const commentVerification = verifyCommentResult(readbackComments, item.comment, commentAction);
      const finalOk = verification.ok && commentVerification.ok;

      results.push({
        id: item.id,
        summary: item.summary || "",
        ok: finalOk,
        commentAction,
        request: {
          endpoint: `/api/v3/items/${item.id}/fields`,
          method: "PUT",
          body: requestBody,
        },
        response: {
          statusCode: patchResponse.status,
          body: patchResponse.data ?? patchResponse.text,
        },
        readback: {
          status: readbackItem?.status?.name || "",
          fields: verification.actualFields,
          latestComment: commentVerification.latestComment,
        },
        verification: {
          statusMatched: verification.statusMatched,
          fieldChecks: verification.fieldChecks,
          commentMatched: commentVerification.ok,
          commentCheck: commentVerification.check,
        },
        updatedBug: {
          id: item.id,
          status: readbackItem?.status?.name || "",
          fields: verification.actualFields,
        },
        error: buildCombinedExecutionError(verification, commentVerification),
      });
    } catch (error) {
      results.push({
        id: item.id,
        summary: item.summary || "",
        ok: false,
        commentAction,
        request: {
          endpoint: `/api/v3/items/${item.id}/fields`,
          method: "PUT",
          body: requestBody,
        },
        response: null,
        error: error instanceof Error ? error.message : "未知错误",
      });
    }
  }

  return results;
}

async function createItemComment(auth, itemId, commentText) {
  const endpoint = `/api/v3/items/${itemId}/comments`;
  const attempts = [
    {
      label: "multipartWiki",
      fields: {
        comment: String(commentText || ""),
        commentFormat: "Wiki",
      },
    },
    {
      label: "multipartPlainText",
      fields: {
        comment: String(commentText || ""),
        commentFormat: "PlainText",
      },
    },
  ];

  const failures = [];
  for (const attempt of attempts) {
    const multipart = buildMultipartFormData(attempt.fields);
    const response = await cbRequest(auth, endpoint, {
      method: "POST",
      rawBody: multipart.body,
      headers: {
        "Content-Type": `multipart/form-data; boundary=${multipart.boundary}`,
      },
    });

    if (response.ok) {
      return {
        ok: true,
        endpoint,
        method: "POST",
        attempt: attempt.label,
        requestBody: attempt.fields,
        response: {
          statusCode: response.status,
          body: response.data ?? response.text,
        },
      };
    }

    failures.push({
      attempt: attempt.label,
      requestBody: attempt.fields,
      response: {
        statusCode: response.status,
        body: response.data ?? response.text,
      },
    });
  }

  const latestFailure = failures[failures.length - 1] || null;
  return {
    ok: false,
    endpoint,
    method: "POST",
    attempts: failures,
    error: latestFailure ? `CodeBeamer 返回 ${latestFailure.response.statusCode}` : "未获得响应",
  };
}

function buildMultipartFormData(fields) {
  const boundary = `----cbworkflow${crypto.randomBytes(12).toString("hex")}`;
  const chunks = [];

  for (const [name, rawValue] of Object.entries(fields || {})) {
    if (rawValue == null) {
      continue;
    }

    const value = String(rawValue);
    chunks.push(Buffer.from(`--${boundary}\r\n`, "utf8"));
    chunks.push(Buffer.from(`Content-Disposition: form-data; name="${name}"\r\n\r\n`, "utf8"));
    chunks.push(Buffer.from(value, "utf8"));
    chunks.push(Buffer.from("\r\n", "utf8"));
  }

  chunks.push(Buffer.from(`--${boundary}--\r\n`, "utf8"));
  return {
    boundary,
    body: Buffer.concat(chunks),
  };
}

async function buildTransitionFieldPatch(auth, itemId, toStatus, fieldUpdates, fieldDefinitionsByName, optionCache) {
  const patchValues = [];
  const statusDefinition = fieldDefinitionsByName.get("Status");
  if (!statusDefinition) {
    throw new Error("缺少 Status 字段定义");
  }

  patchValues.push(
    await buildFieldValuePatch(auth, itemId, statusDefinition, toStatus, optionCache),
  );

  for (const [fieldName, fieldValue] of Object.entries(fieldUpdates || {})) {
    if (CLIENT_ONLY_FIELD_NAMES.has(fieldName)) {
      continue;
    }

    const fieldDefinition = fieldDefinitionsByName.get(fieldName);
    if (!fieldDefinition) {
      throw new Error(`缺少字段定义：${fieldName}`);
    }

    patchValues.push(
      await buildFieldValuePatch(auth, itemId, fieldDefinition, fieldValue, optionCache),
    );
  }

  return patchValues;
}

async function buildFieldValuePatch(auth, itemId, fieldDefinition, rawValue, optionCache) {
  const fieldType = String(fieldDefinition.type || "");
  const base = {
    fieldId: fieldDefinition.id,
    name: fieldDefinition.name,
  };

  if (fieldType === "WikiTextField") {
    return {
      ...base,
      type: "WikiTextFieldValue",
      value: formatCodebeamerWikiText(rawValue),
    };
  }

  if (fieldType === "TextField") {
    return {
      ...base,
      type: "TextFieldValue",
      value: String(rawValue || ""),
    };
  }

  if (fieldType === "DateField") {
    return {
      ...base,
      type: "DateFieldValue",
      value: normalizeDateFieldValue(rawValue),
    };
  }

  if (["OptionChoiceField", "MemberField", "TrackerItemChoiceField"].includes(fieldType)) {
    const resolvedValues = await resolveChoiceValues(auth, itemId, fieldDefinition, rawValue, optionCache);
    return {
      ...base,
      type: "ChoiceFieldValue",
      values: resolvedValues,
    };
  }

  throw new Error(`暂不支持写入字段类型：${fieldDefinition.name} (${fieldType})`);
}

async function resolveChoiceValues(auth, itemId, fieldDefinition, rawValue, optionCache) {
  const selectedValues = parseChoiceInputValues(rawValue, Boolean(fieldDefinition.multipleValues));
  if (!selectedValues.length) {
    return [];
  }

  const options = await getItemFieldOptions(auth, itemId, fieldDefinition.id, optionCache);
  return selectedValues.map((selectedValue) => {
    const match = options.find((option) => isMatchingReference(option, selectedValue, fieldDefinition));
    if (!match) {
      throw new Error(`字段 ${fieldDefinition.name} 找不到可用选项：${selectedValue}`);
    }

    return {
      id: match.id,
      name: match.name,
      type: match.type,
    };
  });
}

function parseChoiceInputValues(rawValue, allowMultiple) {
  const text = String(rawValue || "").trim();
  if (!text) {
    return [];
  }

  if (!allowMultiple) {
    return [text];
  }

  return text
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
}

function isMatchingReference(option, rawValue, fieldDefinition = null) {
  const normalizedNeedle = String(rawValue || "").trim().toLowerCase();
  if (!normalizedNeedle) {
    return false;
  }

  const exactMatched = [
    String(option?.name || "").trim().toLowerCase(),
    String(option?.email || "").trim().toLowerCase(),
    String(option?.id || "").trim().toLowerCase(),
  ].includes(normalizedNeedle);

  if (exactMatched) {
    return true;
  }

  if (String(fieldDefinition?.name || "").trim().toLowerCase() === "status") {
    return normalizeComparableStatusName(option?.name) === normalizeComparableStatusName(rawValue);
  }

  return false;
}

async function getItemFieldOptions(auth, itemId, fieldId, optionCache) {
  const cacheKey = `${itemId}:${fieldId}`;
  if (optionCache.has(cacheKey)) {
    return optionCache.get(cacheKey);
  }

  const data = await cbFetchJson(auth, `/api/v3/items/${itemId}/fields/${fieldId}/options?page=1&pageSize=500`);
  const options = Array.isArray(data.references) ? data.references : [];
  optionCache.set(cacheKey, options);
  return options;
}

function normalizeDateFieldValue(rawValue) {
  const value = String(rawValue || "").trim();
  if (!value) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value}T00:00:00.000`;
  }

  return value;
}

function formatCodebeamerWikiText(rawValue) {
  const value = String(rawValue ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();

  if (!value) {
    return "";
  }

  if (containsCodebeamerWikiMarkup(value)) {
    return value.replace(/\n/g, "\r\n");
  }

  return `%%(${CODEBEAMER_WIKI_TEXT_STYLE})${value.replace(/\n/g, "\r\n")}%!`;
}

function containsCodebeamerWikiMarkup(value) {
  const text = String(value || "").trim();
  return (
    text.startsWith("%%") ||
    text.includes("%!") ||
    text.includes("[!") ||
    text.includes("[{") ||
    text.includes("CB:/")
  );
}

function verifyTransitionResult(readbackItem, readbackFields, expectedStatus, expectedFieldUpdates) {
  const actualStatus = String(readbackItem?.status?.name || "").trim();
  const statusMatched = normalizeComparableStatusName(actualStatus) === normalizeComparableStatusName(expectedStatus);
  const actualFields = {};
  const fieldChecks = Object.entries(expectedFieldUpdates || {}).map(([fieldName, expectedValue]) => {
    const actualValue = getFieldValueFromFieldsPayload(readbackFields, fieldName);
    actualFields[fieldName] = actualValue;
    const matched = isFieldValueMatched(expectedValue, actualValue);
    return {
      fieldName,
      expected: expectedValue,
      actual: actualValue,
      matched,
    };
  });

  if (!("Status" in actualFields)) {
    actualFields.Status = actualStatus;
  }

  const failedFields = fieldChecks.filter((check) => !check.matched);
  return {
    ok: statusMatched && failedFields.length === 0,
    error:
      !statusMatched
        ? `状态回读不匹配，期望 ${expectedStatus}，实际 ${actualStatus || "空"}`
        : failedFields.length
          ? `字段回读不匹配：${failedFields.map((item) => item.fieldName).join("、")}`
          : "",
    statusMatched,
    fieldChecks,
    actualFields,
  };
}

function verifyCommentResult(readbackComments, expectedComment, commentAction) {
  const expected = String(expectedComment || "").trim();
  if (!expected) {
    return {
      ok: true,
      latestComment: "",
      check: null,
    };
  }

  const comments = Array.isArray(readbackComments) ? readbackComments : [];
  const latest = comments[comments.length - 1] || null;
  const actualComment = sanitizeNullableFieldValue(latest?.comment || "");
  const matched =
    isFieldValueMatched(expected, actualComment) ||
    comments.some((entry) => isFieldValueMatched(expected, sanitizeNullableFieldValue(entry?.comment || "")));

  return {
    ok: matched,
    latestComment: actualComment,
    check: {
      expected,
      actual: actualComment,
      matched,
      createdCommentId: commentAction?.response?.body?.id || null,
      totalComments: comments.length,
    },
  };
}

function buildCombinedExecutionError(fieldVerification, commentVerification) {
  if (!fieldVerification?.ok) {
    return fieldVerification.error || "字段或状态回读校验失败";
  }

  if (!commentVerification?.ok) {
    return "Comment 已提交，但回读未匹配到预期内容";
  }

  return "";
}

function getFieldValueFromFieldsPayload(fieldsPayload, fieldName) {
  const fields = [
    ...((fieldsPayload && Array.isArray(fieldsPayload.editableFields)) ? fieldsPayload.editableFields : []),
    ...((fieldsPayload && Array.isArray(fieldsPayload.readOnlyFields)) ? fieldsPayload.readOnlyFields : []),
  ];
  const hit = fields.find((field) => String(field.name || "").trim() === String(fieldName || "").trim());
  if (!hit) {
    return "";
  }

  if (Object.prototype.hasOwnProperty.call(hit, "value")) {
    return sanitizeNullableFieldValue(hit.value);
  }

  if (Array.isArray(hit.values)) {
    return hit.values
      .map((item) => item?.name || item?.email || item?.id || "")
      .filter(Boolean)
      .join("; ");
  }

  return "";
}

function sanitizeNullableFieldValue(value) {
  if (value == null) {
    return "";
  }
  if (String(value).toLowerCase() === "null") {
    return "";
  }
  return String(value);
}

function isFieldValueMatched(expectedValue, actualValue) {
  const expected = normalizeComparableText(expectedValue);
  const actual = normalizeComparableText(actualValue);

  if (/^\d{4}-\d{2}-\d{2}$/.test(expected)) {
    return actual.startsWith(expected);
  }

  return expected === actual;
}

function normalizeComparableText(value) {
  return stripCodebeamerWikiTextFormatting(String(value || ""))
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

function stripCodebeamerWikiTextFormatting(value) {
  return String(value || "")
    .replace(/%%\((?:[^()]|\([^)]*\))*\)/g, "")
    .replace(/%%[A-Za-z0-9_-]+/g, "")
    .replace(/%!/g, "");
}

async function serveStatic(req, res, requestUrl) {
  const relativePath = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const normalizedPath = path.normalize(relativePath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(ROOT_DIR, normalizedPath);

  if (!filePath.startsWith(ROOT_DIR)) {
    sendJson(res, 403, { error: "禁止访问该路径" });
    return;
  }

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    sendJson(res, 404, { error: "文件不存在" });
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": contentType });
  fs.createReadStream(filePath).pipe(res);
}

async function loadTrackerBugDataset(auth, trackerId, itemIds, knownItemRefs = []) {
  const tracker = await cbFetchJson(auth, `/api/v3/trackers/${trackerId}`);
  const refNames = new Map((Array.isArray(knownItemRefs) ? knownItemRefs : []).map((item) => [Number(item.id), item.name || ""]));
  const items = await mapWithConcurrency(itemIds, 6, async (itemId) => {
    const [item, fields] = await Promise.all([
      cbFetchJson(auth, `/api/v3/items/${itemId}`),
      cbFetchJson(auth, `/api/v3/items/${itemId}/fields`),
    ]);
    const actualTrackerId = Number(item?.tracker?.id || item?.trackerId || 0);
    if (actualTrackerId !== Number(trackerId)) {
      throw new Error(`Bug #${itemId} \u4e0d\u5c5e\u4e8e Tracker #${trackerId}`);
    }
    return {
      id: itemId,
      name: item?.name || refNames.get(itemId) || "",
      item,
      fields,
    };
  });

  return {
    tracker,
    dataset: {
      fetchedAt: new Date().toISOString(),
      source: {
        projectName: tracker.project?.name || "",
        trackerName: tracker.name || "",
        trackerId: Number(trackerId),
        total: itemIds.length,
        exportedCount: items.length,
        baseUrl: normalizeBaseUrl(auth.baseUrl),
      },
      items,
    },
  };
}

async function loadMyBugsDashboard(auth) {
  const [projectsPayload, userPayload] = await Promise.all([
    cbFetchJson(auth, "/api/v3/projects"),
    cbFetchJson(auth, "/rest/user/self"),
  ]);
  const projects = Array.isArray(projectsPayload) ? projectsPayload : [];
  const user = userPayload && typeof userPayload === "object" ? userPayload : {};
  const identity = buildUserIdentity(auth, user);
  const warnings = [];

  const projectTrackerGroups = await mapWithConcurrency(projects, 4, async (project) => {
    try {
      const trackersPayload = await cbFetchJson(auth, `/api/v3/projects/${project.id}/trackers`);
      const trackers = (Array.isArray(trackersPayload) ? trackersPayload : [])
        .filter(isBugTracker)
        .map((tracker) => ({
          ...tracker,
          project: tracker.project || { id: project.id, name: project.name || "" },
        }));
      return trackers;
    } catch (error) {
      warnings.push(`\u9879\u76ee ${project.name || project.id} \u7684 Tracker \u8bfb\u53d6\u5931\u8d25\uff1a${error.message}`);
      return [];
    }
  });

  const bugTrackers = projectTrackerGroups.flat();
  let scannedItemCount = 0;
  let failedItemCount = 0;
  const trackerResults = await mapWithConcurrency(bugTrackers, 3, async (tracker) => {
    try {
      const refs = await fetchAllTrackerItemRefs(auth, tracker.id);
      scannedItemCount += refs.length;
      const matches = await mapWithConcurrency(refs, 6, async (itemRef) => {
        try {
          const item = await cbFetchJson(auth, `/api/v3/items/${itemRef.id}`);
          const matchedRoles = findCurrentUserRoles(item, identity);
          if (!matchedRoles.length) return null;
          return buildMyBugSummary(item, itemRef, tracker, matchedRoles);
        } catch {
          failedItemCount += 1;
          return null;
        }
      });
      return matches.filter(Boolean);
    } catch (error) {
      warnings.push(`Tracker ${tracker.project?.name || ""} / ${tracker.name || tracker.id} \u626b\u63cf\u5931\u8d25\uff1a${error.message}`);
      return [];
    }
  });

  if (failedItemCount) {
    warnings.push(`${failedItemCount} \u6761 Bug \u56e0\u65e0\u6743\u9650\u6216\u8bfb\u53d6\u5f02\u5e38\u672a\u80fd\u68c0\u67e5\u3002`);
  }

  const items = trackerResults
    .flat()
    .sort((a, b) => String(b.modifiedAt || "").localeCompare(String(a.modifiedAt || "")));

  return {
    fetchedAt: new Date().toISOString(),
    user,
    projects,
    items,
    summary: {
      projectCount: projects.length,
      trackerCount: bugTrackers.length,
      scannedItemCount,
      matchedItemCount: items.length,
      warningCount: warnings.length,
    },
    warnings,
    baseUrl: normalizeBaseUrl(auth.baseUrl),
  };
}

function isBugTracker(tracker) {
  const candidates = [
    tracker?.name,
    tracker?.keyName,
    tracker?.typeName,
    tracker?.trackerType?.name,
    tracker?.type?.name,
    tracker?.type,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return /(^|[^a-z])bugs?([^a-z]|$)/i.test(candidates) || candidates.includes("defect");
}

function buildUserIdentity(auth, user) {
  const ids = new Set();
  const tokens = new Set();
  [user?.id].filter((value) => value !== undefined && value !== null).forEach((value) => ids.add(String(value)));
  [
    auth.username,
    user?.name,
    user?.email,
    user?.userName,
    user?.username,
    [user?.firstName, user?.lastName].filter(Boolean).join(" "),
  ].forEach((value) => {
    const normalized = normalizeIdentityToken(value);
    if (normalized) tokens.add(normalized);
  });
  return { ids, tokens };
}

function normalizeIdentityToken(value) {
  return String(value || "").trim().toLowerCase();
}

function referenceMatchesIdentity(reference, identity, allowIdMatch = true) {
  if (!reference) return false;
  if (typeof reference !== "object") {
    const normalized = normalizeIdentityToken(reference);
    if (!normalized) return false;
    if (identity.tokens.has(normalized)) return true;
    return normalized
      .split(/[;,|\n]+/)
      .map((part) => part.trim())
      .some((part) => identity.tokens.has(part));
  }

  const type = normalizeIdentityToken(reference.type || reference.typeName);
  const isExplicitNonUserReference = type && !type.includes("user") && type.includes("reference");
  if (
    allowIdMatch &&
    !isExplicitNonUserReference &&
    reference.id !== undefined &&
    identity.ids.has(String(reference.id))
  ) {
    return true;
  }

  return [reference.email, reference.name, reference.userName, reference.username]
    .map(normalizeIdentityToken)
    .filter(Boolean)
    .some((value) => identity.tokens.has(value));
}

function referenceListMatchesIdentity(value, identity, allowIdMatch = true) {
  const list = Array.isArray(value) ? value : value == null ? [] : [value];
  return list.some((entry) => referenceMatchesIdentity(entry, identity, allowIdMatch));
}

function findCurrentUserRoles(item, identity) {
  const roles = [];
  const addRole = (role) => {
    if (role && !roles.includes(role)) roles.push(role);
  };

  if (referenceListMatchesIdentity(item?.assignedTo, identity)) addRole("\u8d1f\u8d23\u4eba");
  if (referenceMatchesIdentity(item?.createdBy, identity)) addRole("\u521b\u5efa\u4eba");
  if (referenceListMatchesIdentity(item?.owners, identity)) addRole("Owner");

  const fieldRoleLabels = new Map([
    ["bug analyzer", "Bug Analyzer"],
    ["bug tester", "Bug Tester"],
    ["bug approver", "Bug Approver"],
    ["bug reporter", "Bug Reporter"],
    ["reporter", "Reporter"],
    ["assignee", "Assignee"],
  ]);

  for (const field of Array.isArray(item?.customFields) ? item.customFields : []) {
    const key = normalizeIdentityToken(field?.name);
    const roleLabel = fieldRoleLabels.get(key) || String(field?.name || "").trim();
    if (!roleLabel) continue;
    const value = Array.isArray(field?.values) ? field.values : field?.value;
    if (referenceListMatchesIdentity(value, identity, true)) addRole(roleLabel);
  }

  return roles;
}

function buildMyBugSummary(item, itemRef, tracker, matchedRoles) {
  const customFields = Array.isArray(item?.customFields) ? item.customFields : [];
  const fields = {};
  for (const field of customFields) {
    if (!field?.name) continue;
    fields[field.name] = formatDashboardFieldValue(
      Object.prototype.hasOwnProperty.call(field, "value") ? field.value : field.values,
    );
  }

  return {
    id: Number(item?.id || itemRef?.id),
    name: item?.name || itemRef?.name || "",
    project: {
      id: Number(item?.project?.id || tracker?.project?.id || 0),
      name: item?.project?.name || tracker?.project?.name || "",
    },
    tracker: {
      id: Number(item?.tracker?.id || tracker?.id || 0),
      name: item?.tracker?.name || tracker?.name || "",
    },
    status: item?.status?.name || "Unknown",
    priority: item?.priority?.name || "",
    assignedTo: formatDashboardFieldValue(item?.assignedTo),
    createdBy: formatDashboardFieldValue(item?.createdBy),
    modifiedAt: item?.modifiedAt || "",
    createdAt: item?.createdAt || "",
    matchedRoles,
    fields,
    affectsVersions: formatDashboardFieldValue(item?.versions),
  };
}

function formatDashboardFieldValue(value) {
  if (value === undefined || value === null) return "";
  const list = Array.isArray(value) ? value : [value];
  return list
    .map((entry) => {
      if (entry === undefined || entry === null) return "";
      if (typeof entry === "object") return entry.name || entry.email || entry.id || "";
      return String(entry);
    })
    .filter(Boolean)
    .join("; ");
}

async function fetchAllTrackerItemRefs(auth, trackerId) {
  const pageSize = 100;
  const collected = [];
  let page = 1;
  let total = Infinity;

  while (collected.length < total) {
    const data = await cbFetchJson(
      auth,
      `/api/v3/trackers/${trackerId}/items?page=${page}&pageSize=${pageSize}`,
    );

    const refs = Array.isArray(data.itemRefs) ? data.itemRefs : [];
    total = Number(data.total || refs.length);
    collected.push(...refs);

    if (!refs.length) {
      break;
    }
    page += 1;
  }

  return collected;
}

function buildAuthConfig(body) {
  const baseUrl = String(body.baseUrl || "").trim();
  const username = String(body.username || "").trim();
  const password = String(body.password || "");

  if (!baseUrl || !username || !password) {
    throw new Error("缺少 Base URL、用户名或密码。");
  }

  return { baseUrl, username, password };
}

function createSession() {
  const sessionId = crypto.randomUUID();
  sessions.set(sessionId, Date.now());
  return sessionId;
}

function touchSession(sessionId) {
  sessions.set(sessionId, Date.now());
}

function pruneExpiredSessions() {
  const now = Date.now();
  for (const [sessionId, lastSeenAt] of sessions.entries()) {
    if (now - lastSeenAt > SESSION_TTL_MS) {
      sessions.delete(sessionId);
    }
  }
}

function normalizeBaseUrl(baseUrl) {
  const url = new URL(baseUrl);
  let pathname = url.pathname.replace(/\/+$/, "");
  if (!pathname) pathname = "/cb";
  if (!pathname.endsWith("/cb")) pathname = `${pathname}/cb`;
  url.pathname = pathname;
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

async function cbRequest(auth, apiPath, options = {}) {
  const fullUrl = `${normalizeBaseUrl(auth.baseUrl)}${apiPath}`;
  const token = Buffer.from(`${auth.username}:${auth.password}`, "utf8").toString("base64");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const hasJsonBody = Object.prototype.hasOwnProperty.call(options, "body");
    const hasRawBody = Object.prototype.hasOwnProperty.call(options, "rawBody");
    const bodyText = hasJsonBody ? JSON.stringify(options.body) : undefined;
    const bodyBuffer = hasJsonBody ? Buffer.from(bodyText, "utf8") : hasRawBody ? options.rawBody : undefined;
    const response = await fetch(fullUrl, {
      method: options.method || "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${token}`,
        ...(hasJsonBody ? { "Content-Type": "application/json; charset=utf-8" } : {}),
        ...(options.headers || {}),
      },
      body: bodyBuffer,
      signal: controller.signal,
    });

    const text = await response.text();
    let data = text;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
    }

    return {
      ok: response.ok,
      status: response.status,
      text,
      data,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function cbFetchJson(auth, apiPath) {
  const response = await cbRequest(auth, apiPath);
  if (!response.ok) {
    throw new Error(`CodeBeamer 请求失败 ${response.status}: ${response.text}`);
  }
  return response.data && typeof response.data === "object" ? response.data : {};
}

async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;

  async function runWorker() {
    while (true) {
      const currentIndex = cursor;
      cursor += 1;
      if (currentIndex >= items.length) {
        return;
      }
      results[currentIndex] = await worker(items[currentIndex], currentIndex);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length || 1) }, () => runWorker());
  await Promise.all(workers);
  return results;
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  if (!chunks.length) {
    return {};
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}
