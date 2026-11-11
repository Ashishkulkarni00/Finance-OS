# Automation plan — how a SaaS version gets transactions without typing

Written 2026-11-11, **rewritten the same day.** The first draft automated the user's own HDFC
alerts. The user corrected the framing: *"this automation is not for me, as a SaaS when we
will be doing that time what options do we have?"* So this is the option space for a
multi-user product, not a personal setup.
**Status: research + recommendation. No code. Decisions S1-S4 open (§8).** Not scheduled:
ROADMAP Phase 8 still holds it, and multi-user auth/hosting come first.

Research sources are listed in §10. Prices and licence details come mostly from vendor blogs,
not regulators. **Treat every number here as an estimate to confirm with a quote.**

---

## 1. The shape of the problem

Every finance app in India gets transactions one of five ways. They differ along four axes
that matter to us:

- **Who has to be licensed:** us, a partner, or nobody.
- **Coverage:** which banks, cards, wallets and investments, on which phones.
- **Freshness:** seconds, hours, or a month.
- **Trust cost:** what the user has to hand over (consent screen, SMS inbox, email inbox,
  a file).

**UPI isn't one of the five.** No API lets a third party read a person's UPI history. NPCI
exposes UPI to banks and licensed payment apps (TPAPs), and becoming one of those means
NPCI approval plus a sponsor bank, and you'd only see payments made *through your own app*.
Every UPI payment is a debit on a bank account, so **any bank channel below captures UPI for
free.**

## 2. The options

### Option 1 — Account Aggregator (AA): the official rail

RBI's consent framework. The user approves a consent inside an AA app (Finvu, OneMoney,
Setu, CAMS FinServ, …). Their bank (the FIP) sends data through the AA to us (the **FIU**).
It covers deposits (savings and current), MFs, equities, insurance, NPS and GST.

- **Licence: the blocker.** Only entities regulated by **RBI, SEBI, IRDAI or PFRDA** can be
  FIUs. A plain software company can't. The paths are:
  - **Own licence.** Setu lists SEBI **Registered Investment Adviser** (₹2,000 fee, 45-90
    days, ₹5 lakh net tangible assets, 5 years' experience + certification), PFRDA
    **Retirement Adviser** (small fees and deposit), or IRDAI **Insurance Broker** (₹75 lakh
    capital, so out). The licence must fit the business: a planning app → RIA is the
    natural one.
  - **Partner FIU.** A regulated entity acts as the FIU and we build on top. This is common,
    but it makes our core data flow depend on someone else's licence and terms.
- **Plumbing:** a TSP (Setu, Finvu, FinBox, OneMoney) does the ReBIT-spec FIU module,
  Sahamati certification and multi-AA routing.
- **Cost (estimates, unverified):** ₹5-30 per data fetch, or a subscription with a cap. A
  daily refresh for one user is ~30 fetches a month. **Unit economics need a quote before
  anything else.** One vendor estimate puts a first-year build at ₹5-25 lakh, but that
  vendor sells a competing product.
- **Reality check from Fold** (a Zerodha/Rainmatter-backed PFM app that's built on AA, so
  our closest analogue). Their own published list of problems:
  - Only individual accounts: **no joint accounts**, which families use a lot.
  - Most banks don't share FDs.
  - Some banks aren't live (RBL, Bandhan named).
  - **Wrong or missing transaction IDs: HDFC sends incorrect ones**, and Axis, SBI, Yes and
    Indian Bank send none. The result is duplicates and wrong balances.
  - Wrong timestamps (ICICI, Federal).
  - Inconsistent or missing narrations, so the payee can't be told.
  - Outages lasting months (Kotak account discovery failed ~95% of the time for 6+ months).
- **Freshness:** it's pulled, not pushed, so the data is hours old, not seconds.
- **Credit cards:** I found no reliable confirmation that card data flows through AA at scale.
  Plan as if it doesn't.

**Verdict:** the right long-term rail, and the one that reads as trustworthy to users
("RBI-regulated consent"). But it needs a licence or a partner, it costs money per fetch,
and its data needs heavy cleaning. **It can't be the launch channel.**

### Option 2 — Email forwarding address: the low-friction launch channel

Every user gets a private inbound address (e.g. `ash-7f3k@in.kosh.app`) and sets a Gmail or
Outlook **filter to auto-forward** bank alerts, card alerts and e-statements to it. Inbound
mail goes through SES, Postmark or Mailgun to a parser. Expensify (receipts), TripIt (bookings)
and others use the same pattern.

- **Licence:** none. The user forwards their own mail; we never read their inbox.
- **Coverage:** every Indian bank and card sends email alerts and PDF e-statements, so it
  works on Android, iOS and web alike. It picks up cards, which AA probably doesn't.
- **Freshness:** minutes for alerts, monthly for statements.
- **Trust cost:** low, and the user can see it. They choose exactly which senders forward,
  and they can stop it in their own Gmail.
- **Costs to us:**
  - **A parser per bank and per alert template.** Templates change without notice, so this
    is ongoing maintenance. Start with the top ~8 banks (HDFC, ICICI, SBI, Axis, Kotak, IDFC
    First, Yes, IndusInd) and their cards.
  - **Statement PDFs are password-protected** (DOB/name/PAN-derived). The user has to give
    the password once and we store it encrypted, or they upload unlocked PDFs instead.
  - Onboarding friction: setting up a Gmail filter is 6 taps and many users will drop off.
    Gmail sends a confirmation code to the forwarding address; our inbox can catch it and
    show it in the app, which cuts the steps.
- **Not the same as Gmail OAuth (Option 2b, rejected for launch).** Reading the inbox via
  `gmail.readonly` triggers Google's restricted-scope verification and a **yearly CASA
  security assessment**, with reports from ~$550 to $15k-75k. It also asks users to hand
  over their *whole* inbox, a far bigger trust ask for the same alerts.

### Option 3 — Statement upload (CSV / PDF): the universal fallback

**Already built** for CSV (`importing/`, `/ledger/import`: staged review, duplicate
detection, remembered categories). For SaaS it needs PDF parsing too: in-house per bank,
or a vendor (Perfios, FinBox BankConnect, Signzy, Arya). Those vendors are priced for loan
underwriting, so they're likely too dear per user for a PFM app.
**Always keep this.** It covers banks nobody else covers, joint accounts and back-filling
history at signup.

### Option 4 — SMS reading (Android only)

What Walnut (now Axio) built a 14M-install business on. It's real-time and covers every
bank and card. But:
- **`READ_SMS` is a restricted Play permission.** It's allowed only for approved use cases,
  and Google has pulled unvetted apps. Expense tracking isn't a reliably approved use, and
  apps that still ship it do so as an "optional" feature at the mercy of the next review.
- **iOS has no SMS access at all**, so half the premium audience is excluded.
- It reads every message, OTPs included, which is the worst trust posture of any option.
- Axio itself moved into lending, the business model FINANCIAL_OS §6 names as what broke
  this category's honesty.

**Verdict:** stays a trap (FINANCIAL_OS §6). Re-check Play's policy text only if Option 2
proves too much friction on Android.

### Option 5 — Capture at the moment of payment (complements, doesn't replace)

When a user pays a commitment *from inside our app* (EMI, rent, SIP top-up), we launch their
UPI app with a `upi://pay` intent carrying payee and amount. We already know what was meant
to be paid, so the entry is recorded the moment they come back, and the bank feed later
**confirms** it. This is partial (only payments started here) and Android returns results
unreliably, so treat it as a pre-fill, never as proof. It fits the product's core, though:
paying a commitment and recording it become one act.

### Rejected outright

- **Screen-scraping netbanking with user credentials** (the old Yodlee model). It breaks bank
  terms, means holding passwords, and breaks on every redesign. **Never.**
- **Becoming a UPI TPAP.** Building a payment app is a different company.
- **Global open banking (Plaid, TrueLayer, Salt Edge)**: only relevant if the product leaves
  India.

## 3. Side by side

| | Licence | Coverage | Freshness | Trust ask | Our ongoing cost | Fits launch? |
|---|---|---|---|---|---|---|
| 1 AA | **RIA/partner needed** | Banks + MF + equity + NPS; weak on cards/joint/FD | hours | consent screen (high trust) | per-fetch fees + data cleaning | No, later |
| 2 Email forward | none | all banks + cards, any phone | minutes | user-chosen forwarding | parsers per bank | **Yes** |
| 2b Gmail OAuth | none, but **CASA yearly** | same as 2 | minutes | whole inbox | assessment + parsers | No |
| 3 Upload | none | everything incl. joint accounts | monthly | a file | PDF parsers | **Yes** (have CSV) |
| 4 SMS | Play approval | all banks, Android only | seconds | every SMS | parsers + policy risk | No (trap) |
| 5 Pay-intent | none | payments started in-app | instant | none | small | Yes, as a complement |

## 4. What every option needs: the engine (this is the moat, not the plumbing)

Sources are commodity; Fold, INDmoney and Axio all *get* transactions. What no one does is
carry a commitment through time (FINANCIAL_OS). So whatever channel wins, the same engine
sits behind it, and **it should be built source-agnostic so AA plugs in later without a
rewrite:**

```
 Channel adapters            Normalise              Understand                  Decide
 AA (later) ─────────┐
 Email alert ────────┤                         ┌─ dedupe across sources ──┐
 E-statement PDF ────┼──▶  Observation  ──────▶├─ match to commitment ────┼──▶ auto-record (sure)
 Upload CSV/PDF ─────┤    (date, amount, dir,  ├─ pair own-account xfers ─┤    Inbox (unsure)
 CAS (MF) ───────────┤     acct-last4, payee,  └─ categorise (rules) ─────┘    drop (duplicate)
 Pay-intent ─────────┘     bank ref, source)
```

- **An Observation is evidence; a Transaction is truth.** The same payment seen in an alert,
  then on the statement, then via AA is three observations of one transaction. This keeps
  rule 4 (never count twice) structural. It needs an ADR before any code.
- **Dedupe can't trust bank transaction IDs.** Fold reports HDFC's AA IDs as wrong and four
  banks sending none. So the key is ref-if-present, else last4 + amount + date ±1 + direction,
  scored, not exact.
- **Commitment matching** (EMI NACH debit → settles that month's EMI) is the step no
  competitor does and the reason automation helps *this* product more than an expense
  tracker. Today an import commit doesn't settle commitments, which is the first gap to
  close whatever the channel.
- **Confidence decides visibility.** Auto-record exact commitment matches, known payees and
  own-account transfer pairs, and send the rest to an Inbox. An Inbox that asks about
  everything gets cleared without reading, so aim for under 10 items a week per user.
- **Provenance is visible.** An entry shows "from alert", "confirmed by statement" or "via
  AA". Month close can say "4 entries not yet confirmed": rule 3, never confidently wrong.
- **Rules, not ML, categorise.** They're learned from user corrections and can be audited
  (D8 / ADR-0019).

## 5. Recommended sequence

1. **Launch: Option 3 (upload, extend CSV with PDF) + Option 2 (forwarding address)**, both
   behind the engine in §4. No licence, every bank, both phone platforms. Cards are covered,
   which matters because card spend is where Real Balance is least certain.
2. **Alongside: Option 5** on "Record it" / pay a commitment.
3. **When there is a company and revenue: AA via a TSP.** The licence choice is a strategic
   decision, not a technical one (S2). Email stays on for cards and banks with bad AA data.
4. **Never:** credential scraping, SMS as a core channel, lending to fund the product.

## 6. Requirements that arrive with SaaS, whatever the channel

- **DPDP Act and Rules:** consent records, purpose limitation, deletion on request, breach
  notice. My understanding is that the Rules were notified in late 2025 with obligations
  phased in over ~18 months, but **confirm with counsel; I haven't verified this.**
- **Encryption at rest** for observations and statement passwords. Per-user keys are
  preferable.
- **ADR-0010 extended:** last-4 only, OTPs dropped at the adapter and never stored, raw
  evidence redacted, no amounts or payees in logs.
- **A regulatory check on "decision support".** The more Plan or Ahead *recommends*, the
  closer it gets to "investment advice" under SEBI. Counsel should look at this in the same
  pass as the AA licence, because an RIA licence would answer both.

## 7. Deferred schema (for the engine; not applied, schema frozen)

The `ddl-auto=validate` consequence holds: **the backend won't boot** with these entities
until the DDL is applied.

```sql
CREATE TABLE observation (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  source VARCHAR(30) NOT NULL,            -- EMAIL_ALERT, STATEMENT_PDF, UPLOAD_CSV, CAS, AA, PAY_INTENT
  source_ref VARCHAR(120) NOT NULL,       -- message-id / statement+line / AA txn id / intent id
  observed_on DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  direction VARCHAR(6) NOT NULL,          -- DEBIT / CREDIT
  account_id BIGINT NULL,                 -- resolved from last4; NULL = unknown account
  account_last4 CHAR(4) NULL,
  payee VARCHAR(200) NULL,
  bank_ref VARCHAR(60) NULL,              -- UPI RRN / card auth code, when trustworthy
  raw_redacted VARCHAR(1000) NULL,
  status VARCHAR(20) NOT NULL,            -- NEW, AUTO_RECORDED, IN_INBOX, CONFIRMED, DUPLICATE, IGNORED
  transaction_id BIGINT NULL,
  commitment_id BIGINT NULL,
  created_at TIMESTAMP(6) NOT NULL,
  deleted_at TIMESTAMP(6) NULL,
  UNIQUE KEY uq_obs_source (user_id, source, source_ref),
  KEY ix_obs_match (user_id, account_id, observed_on, amount)
);

CREATE TABLE payee_rule (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  pattern VARCHAR(120) NOT NULL,
  transaction_type VARCHAR(20) NOT NULL,
  category_id BIGINT NULL,
  to_account_id BIGINT NULL,
  commitment_id BIGINT NULL,
  created_at TIMESTAMP(6) NOT NULL,
  deleted_at TIMESTAMP(6) NULL
);

CREATE TABLE inbound_channel (            -- one forwarding address per user
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  address_token VARCHAR(40) NOT NULL UNIQUE,
  kind VARCHAR(20) NOT NULL,              -- EMAIL_FORWARD, AA_CONSENT
  status VARCHAR(20) NOT NULL,
  last_received_at TIMESTAMP(6) NULL,
  created_at TIMESTAMP(6) NOT NULL,
  deleted_at TIMESTAMP(6) NULL
);

ALTER TABLE transaction
  ADD COLUMN provenance VARCHAR(20) NOT NULL DEFAULT 'MANUAL',  -- MANUAL, ALERT, STATEMENT, AA, CONFIRMED
  ADD COLUMN confirmed_at TIMESTAMP(6) NULL;
```

## 8. Open decisions

- **S1.** Launch channel: email forwarding + upload (recommended), or wait for AA?
- **S2.** The AA route when the time comes: own SEBI RIA licence (it fits the
  no-commission stance and may also cover "advice"), or a partner FIU?
- **S3.** Can the *engine* (observations + commitment matching + Inbox, §4) be built now
  against the existing CSV upload? It's useful to a single user today and is the part every
  channel reuses. This one is the natural next step if the user wants movement before SaaS.
- **S4.** Should ROADMAP move "bank statement automation" out of the not-building list?

## 9. What this replaces

The first draft of this file (Gmail IMAP for the user's own HDFC alerts, "Phase A") is
**withdrawn**. The user doesn't want personal automation. The engine design (§4) and schema
(§7) carry over.

## 10. Sources (fetched 2026-11-11)

- Sahamati, FIU eligibility: https://sahamati.org.in/fiu/ · FAQ: https://sahamati.org.in/faq/
- Setu, licences for fintechs to go live on AA: https://setu.co/blog/licences-for-fintechs-to-go-live-on-account-aggregator
- Setu, FIU go-live: https://docs.setu.co/data/account-aggregator/licenses-and-go-live/go-live
- Setu, AA consent conversion: https://blog.setu.co/account-aggregator-consent-conversion-crisis
- Fold, AA challenges: https://www.fold.money/blog/account-aggregator-challenges-path-forward · https://docs.fold.money/introduction-to-aa
- AA pricing estimates (unofficial): https://javajack.github.io/b2b-lending-india/04-integrations/account-aggregator/ · https://digiqt.com/api-details/india/fintech/account-aggregator-api-finvu
- AA build estimate (competitor's): https://casparser.in/blog/state-of-account-aggregator-2026/
- FIP counts: https://financialservices.gov.in/beta/en/account-aggregator-framework
- Gmail restricted scopes / CASA: https://www.unipile.com/integrating-google-oauth-2-0-user-authentication-into-your-app/ · https://community.latenode.com/t/is-casa-tier-2-assessment-necessary-for-all-gmail-api-apps-options-for-indie-developers/22861
- SMS permissions on Play: https://techcrunch.com/?p=1771609 · https://getfinny.app/blog/sms-expense-tracking-app
- Statement-parsing vendors: https://research.finbox.in/blog/bank-statement-analysis-providers-india-evaluation-guide/ · https://perfios.ai/products/document-analysers/
