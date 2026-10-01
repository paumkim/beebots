# Security notes for this fork

This is a fork of [`imikerussell/beebots`](https://github.com/imikerussell/beebots). The trading engine, the risk
layer, the redaction pass and the dependency set are unchanged. This document records what was reviewed, what was
changed, and what is still worth knowing before you put money behind it.

## What was reviewed

Every file in the repo, both lockfiles, all nine binary assets, and the full npm dependency closure.

| Area | Result |
|---|---|
| Engine source (`src/`, 30 modules) | No obfuscation, no `eval`, no dynamic code, no encoded payloads. |
| Outbound network calls | Four hosts only: `eea.okx.com`, `api.openai.com`, `api.github.com`, and the Hive URL (now blank by default). |
| npm closure, 333 packages | Every version's sha512 matches the registry. No typosquats, no git or tarball dependencies, no non-registry resolutions. |
| Vendored OKX kit (`src/okx/kit/`) | Public REST client only. Reaches only `OKX_API_BASE`, GET only, no auth headers, no filesystem writes. |
| Binaries (7 JPEGs, 1 SVG) | All are real images. No data appended after the JPEG end-of-image marker. |
| CI (`.github/workflows/images.yml`) | No pull-request trigger, no third-party actions, no secrets used beyond `GITHUB_TOKEN`. |
| Docker | Base images pinned by digest. Engine runs as `node`, all capabilities dropped, `no-new-privileges`. |

**There is no malware, no cryptominer, no backdoor, and no data exfiltration in this codebase.** The problems were
commercial and privacy-related, plus one real injection surface. Details below.

## What was removed

**Affiliate advertising.** The README carried a Hostinger affiliate link with a tracking ID on the one-click deploy
button and again in the credits, plus a promo code. All gone, along with the "Hosted on Hostinger" card in the
dashboard header and the Hostinger logo it drew. The header now has a plain link to the source repository.

**Visitor tracking.** `/visit` counted unique daily visitors. It hashed the address with a per-day random salt and
stored only the total, which was honest, but it was still a reader-counting endpoint and the number appeared on the
dashboard. Deleted: the endpoint, the `Visitors` class, the counter, and the client-side call.

**A font CDN.** The dashboard loaded Inter and JetBrains Mono from `fonts.googleapis.com`, so every page view told
Google the reader's IP and user agent. The CSS already had system-font fallbacks, so the webfonts were dropped for a
system stack. `font-src` in the CSP no longer names a remote host.

**Phone-home by default.** The update check polled `api.github.com` every six hours and the Hive reported trading
results to `beebots.tech`. Both are now off unless you turn them on: `UPDATE_CHECK=false` and `HIVE_URL=` by default.
`REPO_LINK` and `UPDATE_REPO` point at this fork.

## What was hardened

**Owner rules into the model prompt.** Setup lets you type a sentence per bee, and the result is concatenated into
the prompt sent to Jev on every tick. Anything you paste from another bee's published rules became instructions to
the decision model. `sanitizeRules()` in `src/bees/custom.ts` now splits the text per sentence, converts control and
zero-width characters to spaces, drops lines matching override phrasing (`ignore previous instructions`, `you are
now`, `system:`, and similar), and fences what survives in `<owner_rules>` with an explicit instruction to treat it as
data. It cannot widen the menu: the code builds the menu, universe and sizing before the model is called.

**Operator strings in `href` and `src`.** `REPO_LINK`, `HIVE_URL` and bee portrait paths come from the engine and
were interpolated straight into `href` and `<img src>`. React does not sanitise URL schemes, so a `javascript:` value
would have executed on click. `dashboard/src/safeUrl.ts` now accepts only `http(s)` and root-relative paths for links,
and only root-relative paths or the inline placeholder for images, so no `<img>` can become a request to another
host.

**Origin policy.** The server sent `access-control-allow-origin: *` on `/snapshot`, `/history` and the SSE stream,
so any site a reader visited could read your trading data. Caddy's CSP already restricts the page to `'self'`; that
was the real boundary and it holds.

## Still worth knowing

- **The Setup page is open to the first visitor.** A fresh install serves Setup to anyone who reaches it, for two
  hours, and Setup is where you paste your Jev and OpenAI keys. Whoever arrives first can set the owner password and
  take the install. Run Setup immediately after starting, or front it with your own auth.
- **`@okx_ai/okx-trade-cli` receives your exchange keys.** It is a legitimate OKX package, integrity-verified, and
  its `postinstall` is blocked in `package.json`. Its own code was not audited here. It has a zip reader
  (`yauzl`) and a "Pilot proxy" that spawns a helper binary.
- **`@typesafe-ai/sdk` is three weeks old** and has only three published versions. It talks to `api.typesafe.ai` with
  your Jev key and receives your market state. Used through trusted publishing, so a stolen token cannot publish.
- **`visitors_total` may persist** in an upgraded database. Nothing reads it now.
- **Only paper mode is tested here.** `MODE=live` needs four independent confirmations in `config.ts`, but this
  review did not run it.

## Reporting

Open an issue on this repository. Do not include keys, addresses or trading data.