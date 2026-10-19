# chicagogoogleadsagency.com

Static site for Chicago Google Ads Agency. Plain HTML and CSS with no build step, hosted on Cloudflare Pages.

## Pages

- `/` home
- `/services` overview, plus one page per service: `/search-ads`, `/performance-max`, `/local-services-ads`, `/youtube-ads`, `/conversion-tracking`, `/reporting`
- `/industries` overview, plus `/personal-injury-lawyers`, `/roofing-contractors`, `/plumbers`, `/hvac`, `/dentists`, `/remodeling-contractors`
- `/audit` free audit request form
- `/contact`
- `styles.css`, `site.js`, `404.html`, `sitemap.xml`, `robots.txt`, `_headers`

Every file sits at the top level with no folders, so GitHub's drag-and-drop uploader can't scramble the structure.

## Deploy on Cloudflare Pages

1. Push this folder to a GitHub repo.
2. In Cloudflare: Workers & Pages → Create → Pages → Connect to Git → pick the repo.
3. Framework preset: **None**. Build command: leave empty. Build output directory: `/`.
4. Add the custom domain `chicagogoogleadsagency.com` (and `www`) under the project's Custom domains tab.

Every push to the main branch redeploys automatically.

## Forms (HubSpot)

Both forms send leads to HubSpot form `73a341d5-dd4b-4349-b296-095c586914d1` in account `247730807`. Settings are at the top of `site.js`.

- The name box is split into First name / Last name.
- Monthly spend and Google Ads customer ID go into Message, unless their custom property names are filled in at the top of `site.js` (only do that after adding those properties to the HubSpot form).
- In HubSpot, only Email should be required on the form.

## Before launch, confirm

- FAQ answers on the home page match how you actually run audits.
- Add Google tag / GA4 and conversion tracking for form submissions and `tel:` clicks.
- Add an email address or office address if you want them shown (also add them to the JSON-LD in each page head).

## HubSpot chat

The HubSpot tracking/chat script is not on the site. To add chat back, put the HubSpot embed code (`//js-na2.hs-scripts.com/247730807.js`) before `</head>` on every page, and turn the chatflow on in HubSpot.
