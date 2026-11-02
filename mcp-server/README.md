# Kosh MCP server

Read-only access to Kosh's data from any Claude Code session, over
[MCP](https://modelcontextprotocol.io). Built so a session can be asked financial
questions — *"where did the money go"*, *"which loan first"*, *"what is my 80E interest"* —
without being handed endpoint shapes and left to curl them.

One file, `server.mjs`, no dependencies, no `node_modules`.

## Read-only is structural

`call()` is the only function that touches the network and takes no HTTP method, so `fetch`
uses its GET default. There is no code path that can POST, PATCH or DELETE. A session
cannot write to the data because no tool *can* — not because a rule asked it not to. That
matters: there are no migrations or fixtures available to undo a bad row
(`CLAUDE.md`, standing instruction 5).

`lastFour` is stripped from every account before it leaves the process. Account *names* go
through, since "IDBI Saving" is how any useful answer has to refer to one.

## Requirements

- **Node 22+** — uses built-in `fetch` and `AbortSignal.timeout`.
- **The Kosh backend running** on `:8080`. It is local and not always on; the tools return a
  sentence naming the cause and the fix rather than an empty object, so a session can say
  "unavailable" instead of reasoning confidently from nothing.

```bash
cd webapp/backend/finance && .\mvnw.cmd -B spring-boot:run
```

## Registering it

### Claude Desktop (the chat app)

Config lives at
`%LOCALAPPDATA%\Claude-Data\<account-folder>\claude_desktop_config.json` — the newer
per-account layout, **not** the `%APPDATA%\Claude\` path most guides still give. Add:

```json
{
  "mcpServers": {
    "kosh": {
      "command": "C:\\Program Files\\nodejs\\node.exe",
      "args": ["G:\\FinanceOS\\webapp\\mcp-server\\server.mjs"]
    }
  }
}
```

The **absolute path to `node.exe`** matters: the desktop app spawns servers without a login
shell's `PATH`, so a bare `node` can resolve in a terminal and still fail there.

Quit Claude Desktop fully — the tray icon too, not just the window — and reopen it.
Connection failures land in `%LOCALAPPDATA%\Claude\Logs\mcp.log`.

### Claude Code

`.mcp.json` at the repo's parent (`G:\FinanceOS\`) is machine-local config and is not
tracked. Any session started in that folder picks it up:

```json
{
  "mcpServers": {
    "kosh": { "command": "node", "args": ["G:\\FinanceOS\\webapp\\mcp-server\\server.mjs"] }
  }
}
```

Verify with `/mcp`, which lists connected servers and their tools.

### Either client

`KOSH_API_BASE` overrides the base URL (default `http://localhost:8080/api/v1`).

## Testing it without a client

The transport is newline-delimited JSON-RPC on stdin, so it can be driven from a shell:

```bash
printf '%s\n' \
 '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{}}}' \
 '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
 | node server.mjs
```

The server drains in-flight requests before exiting on stdin close, so a piped call like
this returns its answers rather than losing them.

## The tools

| Tool | Answers |
|---|---|
| `kosh_ca_brief` | `CA_BRIEF.md` itself — how to read this data, and what Kosh does not record. |
| `kosh_financial_state` | The whole position. The right first call for almost anything. |
| `kosh_accounts` | Balances, and what is available after money set aside. |
| `kosh_transactions` | Individual entries, filtered by date, type, account, category or cycle. |
| `kosh_spending_summary` | In, out and transferred as three figures — never one net. |
| `kosh_categories` | Categories and their group (Income / Fixed / Flexible). |
| `kosh_loans` | Every loan with rate, EMI, outstanding principal and payoff date. |
| `kosh_loan_schedule` | One loan's amortisation — the interest/principal split, for 80E. |
| `kosh_investments` | Holdings, value, and whether each can be reached quickly. |
| `kosh_insurance` | Policies, cover and premium — the basis of an 80D claim. |
| `kosh_commitments` | The standing plan: what is promised each month. |
| `kosh_goals` | Targets, progress and pace. |
| `kosh_cycles` | The salary months (28th to 27th), newest first. |
| `kosh_cycle_detail` | One salary month in full, with its day-to-day spending. |
| `kosh_forecast` | The months ahead with everything promised projected forward. |
| `kosh_timeline` | Dated obligations coming up, soonest first. |
| `kosh_insights` | What Kosh itself currently flags, with the figures behind it. |

## Using it as a CA session

[`CA_BRIEF.md`](CA_BRIEF.md) is the companion: the role, the reading rules that are easy to
get wrong (the 28–27 salary month against the Apr–Mar financial year, transfers that are not
spending, null that is never zero), and — the part that decides whether a tax answer is
possible at all — **what Kosh does not know**: gross salary, TDS, EPF, HRA, rent, regime
choice.

It reaches a session three ways, because a desktop chat cannot open a file:

- **Claude Desktop** — the **+** menu lists **Kosh: personal CA**, served as an MCP prompt.
- **Any client** — the `kosh_ca_brief` tool returns it, so the model can pull it mid-chat
  when tax comes up without the prompt having been picked.
- **Claude Code** — *"read `webapp/mcp-server/CA_BRIEF.md` and act as my personal CA"*.

The brief is read from disk on each call rather than held in memory, so editing it takes
effect without restarting the server.
