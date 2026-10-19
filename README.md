# chicagogoogleadsagency.com

Static site for Chicago Google Ads Agency. Plain HTML and CSS with no build step, hosted on Cloudflare Pages.

## Pages

- `/` home
- `/services/` overview, plus one page per service: search-ads, performance-max, local-services-ads, youtube-ads, conversion-tracking, reporting
- `/audit` free audit request form
- `/contact`
- `404.html`, `sitemap.xml`, `robots.txt`, `_headers`

## Deploy on Cloudflare Pages

1. Push this folder to a GitHub repo.
2. In Cloudflare: Workers & Pages → Create → Pages → Connect to Git → pick the repo.
3. Framework preset: **None**. Build command: leave empty. Build output directory: `/`.
4. Add the custom domain `chicagogoogleadsagency.com` (and `www`) under the project's Custom domains tab.

Every push to the main branch redeploys automatically.

## Turn on the forms

The audit and contact forms need somewhere to send submissions. The simplest option:

1. Create a free form at https://formspree.io and copy its endpoint (looks like `https://formspree.io/f/abcd1234`).
2. Paste it into `FORM_ENDPOINT` at the top of `assets/site.js`.

Until that's set, the forms ask visitors to call (708) 529-1923 instead.

## Before launch, confirm

- FAQ answers on the home page match how you actually run audits.
- Add Google tag / GA4 and conversion tracking for form submissions and `tel:` clicks.
- Add an email address or office address if you want them shown (also add them to the JSON-LD in each page head).
