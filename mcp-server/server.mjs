#!/usr/bin/env node
/**
 * Kosh MCP server - read-only access to one person's financial data.
 *
 * Speaks MCP over stdio so a Claude Code session can ask Kosh questions directly
 * instead of being told endpoint shapes and left to curl them. Every tool below is a
 * GET against the local Spring Boot app.
 *
 * ## Read-only is structural, not a promise
 *
 * `call()` is the only function that touches the network and it has no `method`
 * parameter, so `fetch` uses its GET default and there is no code path that could
 * issue a POST, PATCH or DELETE. A tool cannot write to the user's data because no
 * tool *can* - rather than because a rule asked it not to. That matters here: the
 * database has no migrations or test fixtures available to undo a bad row
 * (`CLAUDE.md`, standing instruction 5).
 *
 * ## Zero dependencies, on purpose
 *
 * MCP's stdio transport is newline-delimited JSON-RPC 2.0, and Node 22 has `fetch`
 * built in. The SDK would add an install step and a version to keep current in a
 * repo that has two package manifests already. One file with no `node_modules` is
 * easier to audit, and auditing is the point for something that reads bank balances.
 *
 * ## What is withheld
 *
 * `lastFour` is stripped from every account before it leaves this process. Kosh
 * never stores a full account number, CVV, PIN or OTP (ADR-0010), so the last four
 * digits are the most identifying thing in the data - and nothing a financial
 * question needs. Account *names* go through, because "IDBI Saving" is how any
 * useful answer has to refer to it.
 *
 * Run:  node server.mjs          (expects the backend on :8080)
 * Env:  KOSH_API_BASE            override the base URL
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = (process.env.KOSH_API_BASE ?? 'http://localhost:8080/api/v1').replace(/\/$/, '');
const TIMEOUT_MS = 15000;
const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * The CA brief, served by the server rather than read from disk by the client.
 *
 * <p>A Claude Code session can be told "read CA_BRIEF.md". A **Claude Desktop** chat
 * cannot - it has no filesystem access, and this server is the only channel it has
 * into this folder. So the brief ships through MCP twice: as a *prompt*, which
 * Desktop lists under its "+" menu and inserts as the opening message, and as a
 * *tool*, so the model can fetch it mid-conversation when someone starts asking tax
 * questions without having picked the prompt.
 *
 * <p>Read at call time, not at startup: the brief is edited far more often than the
 * server is restarted, and a stale copy held in memory would be a quiet way to give
 * advice under last week's rules.
 */
function caBrief() {
  try {
    return readFileSync(join(HERE, 'CA_BRIEF.md'), 'utf8');
  } catch (err) {
    return `The CA brief could not be read from ${join(HERE, 'CA_BRIEF.md')} (${err?.message ?? err}). Ask before relying on any tax reasoning - the brief holds what Kosh does and does not know.`;
  }
}

/* ────────────────────────────── the API ────────────────────────────── */

/**
 * One GET, or a sentence explaining why there isn't one.
 *
 * A dead backend is the single most likely failure here and it is invisible from
 * inside a chat: the session asks for a balance, gets an empty object, and reasons
 * confidently from nothing. So a connection failure returns prose that names the
 * cause and the fix, which is the same rule the product itself follows - missing
 * data says so, it never reads as zero (`CLAUDE.md` rule 3).
 */
async function call(path, params = {}) {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }

  let res;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (err) {
    return {
      error: 'Kosh is not reachable',
      detail:
        `Could not reach the Kosh backend at ${BASE}. It runs locally and is not always on. ` +
        `Start it with: cd webapp/backend/finance && .\\mvnw.cmd -B spring-boot:run ` +
        `Then ask again. Do not answer from memory or estimate the figures - say it is unavailable.`,
      cause: String(err?.message ?? err),
    };
  }

  const body = await res.text();
  if (!res.ok) {
    return { error: `Kosh returned ${res.status}`, detail: body.slice(0, 600) };
  }

  try {
    return redact(JSON.parse(body));
  } catch {
    return { error: 'Kosh returned a response that was not JSON', detail: body.slice(0, 600) };
  }
}

/** Strips `lastFour` wherever it appears. See the header note on what is withheld. */
function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === 'lastFour') continue;
      out[k] = redact(v);
    }
    return out;
  }
  return value;
}

/* ────────────────────────────── the tools ────────────────────────────── */

const DATE = { type: 'string', description: 'YYYY-MM-DD' };
const str = (description) => ({ type: 'string', description });
const num = (description) => ({ type: 'number', description });

/**
 * Each entry is one GET, named for the question it answers rather than for the
 * endpoint it calls. The descriptions are written for a reader deciding which tool
 * to reach for, so they say what the figure *means* and, where it matters, what it
 * deliberately excludes - a tool described only as "returns accounts" invites the
 * reader to assume it returns everything.
 */
const TOOLS = [
  {
    name: 'kosh_ca_brief',
    description:
      'HOW TO READ THIS DATA — fetch this before answering anything about tax, deductions, or ' +
      'what a month cost. Holds the reading rules that are otherwise got wrong (the salary month ' +
      'runs 28th to 27th and does not align with the 1 Apr – 31 Mar financial year; transfers are ' +
      'not spending; null never means zero) and, critically, what Kosh does NOT record — gross ' +
      'salary, TDS, EPF, HRA, rent, regime choice — so a tax figure is not computed from take-home.',
    schema: { type: 'object', properties: {} },
    run: async () => caBrief(),
  },
  {
    name: 'kosh_financial_state',
    description:
      'The whole position in one call, and the right first call for almost any question. ' +
      'Real Balance (held − reserved − committed) and the day rate, the current salary-month cycle, ' +
      'net worth, total debt with its EMI share of income, how long reachable money would cover ' +
      'essentials if income stopped, and the usual monthly day-to-day spend. ' +
      'Null anywhere means unknown, never zero.',
    schema: { type: 'object', properties: {} },
    run: () => call('/financial-state'),
  },
  {
    name: 'kosh_accounts',
    description:
      'Every bank, cash and credit-card account with its current balance, what is available after ' +
      'money set aside, and whether it counts as spendable. Account numbers are never returned.',
    schema: { type: 'object', properties: {} },
    run: () => call('/accounts', { size: 100 }),
  },
  {
    name: 'kosh_transactions',
    description:
      'The ledger - individual transactions, newest first. Use for "where did the money actually go". ' +
      'A credit-card purchase is an expense when swiped; paying the card bill and withdrawing cash are ' +
      'TRANSFERs, not spending, so never add TRANSFER rows into a spend total.',
    schema: {
      type: 'object',
      properties: {
        dateFrom: DATE,
        dateTo: DATE,
        type: { type: 'string', enum: ['EXPENSE', 'INCOME', 'TRANSFER', 'INVESTMENT', 'REFUND'] },
        accountId: num('Limit to one account'),
        categoryId: num('Limit to one category'),
        cycleId: num('Limit to one salary month - see kosh_cycles'),
        q: str('Free-text search of the description'),
        size: num('Rows to return, default 200, max 500'),
      },
    },
    run: (a) => call('/transactions', { ...a, size: Math.min(a.size ?? 200, 500) }),
  },
  {
    name: 'kosh_spending_summary',
    description:
      'Totals for the same filters as kosh_transactions, as money in, money out and transferred - ' +
      'three figures, never one net. Far cheaper than totalling rows, and it is the server doing the ' +
      'arithmetic rather than the reader.',
    schema: {
      type: 'object',
      properties: {
        dateFrom: DATE,
        dateTo: DATE,
        type: { type: 'string', enum: ['EXPENSE', 'INCOME', 'TRANSFER', 'INVESTMENT', 'REFUND'] },
        accountId: num('Limit to one account'),
        categoryId: num('Limit to one category'),
        cycleId: num('Limit to one salary month'),
        q: str('Free-text search of the description'),
      },
    },
    run: (a) => call('/transactions/summary', a),
  },
  {
    name: 'kosh_categories',
    description:
      'The spending categories and which group each belongs to (Income, Fixed, Flexible). ' +
      'Needed to read categoryId on a transaction. There are deliberately no per-category budgets.',
    schema: { type: 'object', properties: {} },
    run: () => call('/categories', { size: 100 }),
  },
  {
    name: 'kosh_loans',
    description:
      'Every loan: lender, outstanding principal, interest rate, EMI, EMIs remaining and payoff date, ' +
      'plus a summary across all of them. "Outstanding" is principal - what it would cost to close the ' +
      'loan today - not the sum of future EMIs.',
    schema: { type: 'object', properties: {} },
    run: async () => ({
      loans: await call('/loans', { size: 50 }),
      summary: await call('/loans/summary'),
    }),
  },
  {
    name: 'kosh_loan_schedule',
    description:
      'One loan\'s amortisation schedule, each row splitting the EMI into interest and principal. ' +
      'This is how to establish interest actually payable in a financial year - for an education loan, ' +
      'the figure that matters for a Section 80E deduction.',
    schema: {
      type: 'object',
      properties: { loanId: num('The loan id, from kosh_loans') },
      required: ['loanId'],
    },
    run: (a) => call(`/loans/${a.loanId}/schedule`),
  },
  {
    name: 'kosh_investments',
    description:
      'Holdings - SIPs, RDs, deposits - with current value, contribution and whether each can be ' +
      'reached quickly. Locked-away holdings are flagged, because counting them as available ' +
      'overstates what could be raised in a hurry.',
    schema: { type: 'object', properties: {} },
    run: async () => ({
      investments: await call('/investments', { size: 50 }),
      summary: await call('/investments/summary'),
    }),
  },
  {
    name: 'kosh_insurance',
    description:
      'Insurance policies with cover, premium and renewal date. Health premiums are the basis of a ' +
      'Section 80D claim; life cover is what a dependants question turns on.',
    schema: { type: 'object', properties: {} },
    run: async () => ({
      policies: await call('/insurance-policies', { size: 50 }),
      summary: await call('/insurance-policies/summary'),
    }),
  },
  {
    name: 'kosh_commitments',
    description:
      'The standing plan - every recurring obligation with its amount, due day, paying account and ' +
      'whether it is mandatory. This is what is promised each month, as opposed to what was spent.',
    schema: {
      type: 'object',
      properties: { includeArchived: { type: 'boolean', description: 'Include stopped commitments' } },
    },
    run: (a) => call('/commitments', { size: 100, includeArchived: a.includeArchived ?? false }),
  },
  {
    name: 'kosh_goals',
    description: 'Savings goals with target, target date, amount saved so far and whether each is on pace.',
    schema: { type: 'object', properties: {} },
    run: () => call('/goals', { size: 50 }),
  },
  {
    name: 'kosh_cycles',
    description:
      'The salary months, newest first. Kosh\'s month runs salary date to salary date (28th to 27th), ' +
      'NOT the calendar month - so never assume a cycle matches a calendar month or a tax quarter. ' +
      'Use the ids here to scope kosh_transactions or kosh_cycle_detail.',
    schema: { type: 'object', properties: { size: num('How many cycles, default 18') } },
    run: (a) => call('/cycles', { size: a.size ?? 18 }),
  },
  {
    name: 'kosh_cycle_detail',
    description:
      'One salary month in full: what came in, what was committed, what was set aside and what was left ' +
      'flexible, plus its day-to-day spending. The way to compare months honestly.',
    schema: {
      type: 'object',
      properties: { cycleId: num('From kosh_cycles') },
      required: ['cycleId'],
    },
    run: async (a) => ({
      summary: await call(`/cycles/${a.cycleId}/summary`),
      flexibleSpending: await call(`/cycles/${a.cycleId}/flexible-spending`),
    }),
  },
  {
    name: 'kosh_forecast',
    description:
      'The months ahead with every commitment, EMI and expected salary projected forward - what is ' +
      'left over each month, and when a loan ending frees money up. A projection from the current plan, ' +
      'not a prediction of behaviour.',
    schema: { type: 'object', properties: { months: num('How far ahead, default 12') } },
    run: (a) => call('/forecast', { months: a.months ?? 12 }),
  },
  {
    name: 'kosh_timeline',
    description: 'Dated obligations coming up - bills, EMIs, card statements - and expected income, soonest first.',
    schema: { type: 'object', properties: { days: num('Horizon in days, default 45') } },
    run: (a) => call('/timeline', { days: a.days ?? 45 }),
  },
  {
    name: 'kosh_insights',
    description:
      'What Kosh itself currently flags: an account that will not cover a bill, something overdue, ' +
      'money sitting idle against expensive debt. Each carries the figures behind it.',
    schema: { type: 'object', properties: {} },
    run: () => call('/insights', { surface: 'TODAY' }),
  },
];

const BY_NAME = new Map(TOOLS.map((t) => [t.name, t]));

/**
 * Prompts, for clients that offer them - Claude Desktop lists these under "+" and drops
 * the text in as the opening message, which is the whole setup step for a chat that has
 * no way to open a file.
 */
const PROMPTS = [
  {
    name: 'personal_ca',
    title: 'Kosh: personal CA',
    description:
      'Act as a chartered accountant on this person\'s own financial data, with the reading rules ' +
      'and the limits of what Kosh records.',
    arguments: [],
    build: () =>
      `${caBrief()}\n\n---\n\nTake the role above. Write in plain, simple English throughout — ` +
      `short sentences, everyday words, no jargon without explaining it once. Begin by calling ` +
      `\`kosh_financial_state\` and telling me, in a few lines, where I stand right now — then ` +
      `wait for my question.`,
  },
];

const PROMPT_BY_NAME = new Map(PROMPTS.map((p) => [p.name, p]));

/* ────────────────────────────── the protocol ────────────────────────────── */

const SERVER_INFO = { name: 'kosh', version: '1.0.0', title: 'Kosh — personal financial data (read-only)' };
const FALLBACK_PROTOCOL = '2025-06-18';

function send(message) {
  process.stdout.write(JSON.stringify(message) + '\n');
}

function result(id, value) {
  send({ jsonrpc: '2.0', id, result: value });
}

function failure(id, code, message) {
  send({ jsonrpc: '2.0', id, error: { code, message } });
}

async function handle(msg) {
  const { id, method, params } = msg;
  // A notification has no id and must never be answered - replying to one is a
  // protocol error that some clients treat as fatal.
  const isNotification = id === undefined || id === null;

  switch (method) {
    case 'initialize':
      // Echo the client's protocol version when it offers one: this server has no
      // version-specific behaviour, so agreeing with the client is both honest and
      // the most compatible thing it can do.
      return result(id, {
        protocolVersion: typeof params?.protocolVersion === 'string' ? params.protocolVersion : FALLBACK_PROTOCOL,
        capabilities: { tools: { listChanged: false }, prompts: { listChanged: false } },
        serverInfo: SERVER_INFO,
      });

    case 'notifications/initialized':
    case 'notifications/cancelled':
      return;

    case 'ping':
      return result(id, {});

    case 'tools/list':
      return result(id, {
        tools: TOOLS.map((t) => ({ name: t.name, description: t.description, inputSchema: t.schema })),
      });

    case 'prompts/list':
      return result(id, {
        prompts: PROMPTS.map((p) => ({
          name: p.name,
          title: p.title,
          description: p.description,
          arguments: p.arguments,
        })),
      });

    case 'prompts/get': {
      const prompt = PROMPT_BY_NAME.get(params?.name);
      if (!prompt) return failure(id, -32602, `No such prompt: ${params?.name}`);
      return result(id, {
        description: prompt.description,
        messages: [{ role: 'user', content: { type: 'text', text: prompt.build() } }],
      });
    }

    case 'tools/call': {
      const tool = BY_NAME.get(params?.name);
      if (!tool) return failure(id, -32602, `No such tool: ${params?.name}`);
      try {
        const value = await tool.run(params.arguments ?? {});
        // The brief is prose meant to be read; everything else is data. Wrapping prose in
        // JSON quotes it into one escaped line and makes it markedly harder to follow.
        const text = typeof value === 'string' ? value : JSON.stringify(value, null, 1);
        return result(id, { content: [{ type: 'text', text }] });
      } catch (err) {
        // Reported as a tool result rather than a JSON-RPC error, so the model sees
        // what went wrong and can say so, instead of the client swallowing it.
        return result(id, {
          isError: true,
          content: [{ type: 'text', text: `Kosh tool "${tool.name}" failed: ${String(err?.message ?? err)}` }],
        });
      }
    }

    default:
      if (isNotification) return;
      return failure(id, -32601, `Method not supported: ${method}`);
  }
}

/* stdin arrives in arbitrary chunks, so messages are reassembled by newline rather
   than assumed to be one per read. */
let buffer = '';

/**
 * Requests still awaiting a GET.
 *
 * Every handler is async, so exiting the moment stdin closes drops whatever is still
 * in flight and the client is left waiting for a reply that was never sent. Claude
 * Code keeps the pipe open and would not have hit it; a scripted call that writes its
 * requests and closes does, which is how this was found. Draining first is correct in
 * both cases.
 */
let inFlight = 0;
let inputEnded = false;

function maybeExit() {
  if (inputEnded && inFlight === 0) process.exit(0);
}

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;
  let cut;
  while ((cut = buffer.indexOf('\n')) !== -1) {
    const line = buffer.slice(0, cut).trim();
    buffer = buffer.slice(cut + 1);
    if (!line) continue;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      // Nothing useful to reply to: without a parsed id there is no request to fail.
      continue;
    }
    inFlight += 1;
    handle(msg)
      .catch((err) => {
        if (msg.id !== undefined && msg.id !== null) failure(msg.id, -32603, String(err?.message ?? err));
      })
      .finally(() => {
        inFlight -= 1;
        maybeExit();
      });
  }
});

process.stdin.on('end', () => {
  inputEnded = true;
  maybeExit();
});
