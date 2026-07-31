const { listAdminState, statusForError, verifyAdminToken } = require("../ui/supabaseStore");

const EXPORT_TYPES = new Set([
  "reviewed-providers",
  "outreach-queue",
  "claim-requests",
  "leads",
  "events",
  "signals",
]);

function csvEscape(value) {
  const text = value === null || value === undefined ? "" : String(value);

  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(rows, columns) {
  return [
    columns.map((column) => csvEscape(column.label)).join(","),
    ...rows.map((row) => columns.map((column) => csvEscape(column.value(row))).join(",")),
  ].join("\n");
}

function statusForProvider(provider = {}) {
  return provider.status || provider.lifecycleStatus || "";
}

function reviewedProviders(state) {
  return state.providers.filter((provider) => !["scraped", "in_review"].includes(statusForProvider(provider)));
}

function outreachQueue(state) {
  return state.providers.flatMap((provider) => (provider.outreachMessages || []).map((message) => ({
    provider,
    message,
  })));
}

function managedEvents(state) {
  return state.providers.flatMap((provider) => (provider.managedProviderEvents || []).map((event) => ({
    provider,
    event,
  })));
}

function managedSignals(state) {
  return state.providers.flatMap((provider) => (provider.managedMarketSignals || []).map((signal) => ({
    provider,
    signal,
  })));
}

function exportDefinition(type, state) {
  if (type === "reviewed-providers") {
    return {
      filename: "reviewed-providers.csv",
      rows: reviewedProviders(state),
      dateField: (row) => row.updatedAt,
      columns: [
        { label: "Company", value: (row) => row.companyName },
        { label: "Domain", value: (row) => row.domain },
        { label: "Status", value: statusForProvider },
        { label: "Confidence", value: (row) => row.confidenceScore },
        { label: "Claimed", value: (row) => row.claimed ? "yes" : "no" },
        { label: "Updated At", value: (row) => row.updatedAt },
      ],
    };
  }

  if (type === "outreach-queue") {
    return {
      filename: "outreach-queue.csv",
      rows: outreachQueue(state),
      dateField: (row) => row.message.approvedAt,
      columns: [
        { label: "Company", value: (row) => row.provider.companyName },
        { label: "Domain", value: (row) => row.provider.domain },
        { label: "Step", value: (row) => row.message.messageStep },
        { label: "Channel", value: (row) => row.message.channel },
        { label: "Status", value: (row) => row.message.status },
        { label: "Subject", value: (row) => row.message.subject },
        { label: "Approved By", value: (row) => row.message.approvedBy },
        { label: "Approved At", value: (row) => row.message.approvedAt },
      ],
    };
  }

  if (type === "claim-requests") {
    return {
      filename: "claim-requests.csv",
      rows: state.claimRequests || [],
      dateField: (row) => row.createdAt,
      columns: [
        { label: "Domain", value: (row) => row.domain },
        { label: "Email", value: (row) => row.email },
        { label: "Type", value: (row) => row.requestType },
        { label: "Status", value: (row) => row.status },
        { label: "Verification", value: (row) => row.verificationMethod },
        { label: "Reviewed By", value: (row) => row.reviewedBy },
        { label: "Reviewed At", value: (row) => row.reviewedAt },
        { label: "Created At", value: (row) => row.createdAt },
      ],
    };
  }

  if (type === "leads") {
    return {
      filename: "provider-leads.csv",
      rows: state.providerLeads || [],
      dateField: (row) => row.createdAt,
      columns: [
        { label: "Domain", value: (row) => row.domain },
        { label: "Name", value: (row) => row.name },
        { label: "Company", value: (row) => row.company },
        { label: "Email", value: (row) => row.email },
        { label: "Message", value: (row) => row.message },
        { label: "Status", value: (row) => row.status },
        { label: "Reviewed By", value: (row) => row.reviewedBy },
        { label: "Reviewed At", value: (row) => row.reviewedAt },
        { label: "Created At", value: (row) => row.createdAt },
      ],
    };
  }

  if (type === "events") {
    return {
      filename: "provider-events.csv",
      rows: managedEvents(state),
      dateField: (row) => row.event.approvedAt,
      columns: [
        { label: "Company", value: (row) => row.provider.companyName },
        { label: "Domain", value: (row) => row.provider.domain },
        { label: "Title", value: (row) => row.event.title },
        { label: "Starts At", value: (row) => row.event.startsAt },
        { label: "Status", value: (row) => row.event.status },
        { label: "Online", value: (row) => row.event.online ? "yes" : "no" },
        { label: "Source URL", value: (row) => row.event.sourceUrl },
        { label: "Approved By", value: (row) => row.event.approvedBy },
        { label: "Approved At", value: (row) => row.event.approvedAt },
      ],
    };
  }

  return {
    filename: "market-signals.csv",
    rows: managedSignals(state),
    dateField: (row) => row.signal.approvedAt,
    columns: [
      { label: "Company", value: (row) => row.provider.companyName },
      { label: "Domain", value: (row) => row.provider.domain },
      { label: "Type", value: (row) => row.signal.signalType },
      { label: "Title", value: (row) => row.signal.title },
      { label: "Status", value: (row) => row.signal.status },
      { label: "Source URL", value: (row) => row.signal.sourceUrl },
      { label: "Observed At", value: (row) => row.signal.observedAt },
      { label: "Approved By", value: (row) => row.signal.approvedBy },
      { label: "Approved At", value: (row) => row.signal.approvedAt },
    ],
  };
}

function filterRowsByDateRange(rows, dateField, from, to) {
  if (!from && !to) {
    return rows;
  }

  const fromTime = from ? new Date(from).getTime() : null;
  const toTime = to ? new Date(`${to}T23:59:59.999Z`).getTime() : null;

  return rows.filter((row) => {
    const rowTime = new Date(dateField(row)).getTime();

    if (Number.isNaN(rowTime)) {
      return false;
    }

    if (fromTime !== null && rowTime < fromTime) {
      return false;
    }

    if (toTime !== null && rowTime > toTime) {
      return false;
    }

    return true;
  });
}

module.exports = async function handler(request, response) {
  if (request.method !== "GET") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    await verifyAdminToken(request.headers.authorization);
    const type = request.query?.type || "reviewed-providers";

    if (!EXPORT_TYPES.has(type)) {
      response.status(400).json({ error: "Unsupported export type." });
      return;
    }

    const state = await listAdminState();
    const definition = exportDefinition(type, state);
    const rows = filterRowsByDateRange(definition.rows, definition.dateField, request.query?.from, request.query?.to);

    response.setHeader("Content-Type", "text/csv; charset=utf-8");
    response.setHeader("Content-Disposition", `attachment; filename="${definition.filename}"`);
    response.status(200).send(toCsv(rows, definition.columns));
  } catch (error) {
    response.status(statusForError(error)).json({ error: error.message });
  }
};
