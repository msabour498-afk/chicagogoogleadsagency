// ---------------------------------------------------------------
// HubSpot connection
// Both website forms (free audit + contact) send leads to this
// HubSpot form. Values come from the HubSpot embed code.
// ---------------------------------------------------------------
const HUBSPOT_PORTAL_ID = "247730807";
const HUBSPOT_FORM_ID = "73a341d5-dd4b-4349-b296-095c586914d1";

// Internal names of your custom HubSpot properties (Settings → Properties).
// Leave a name blank and that answer goes into the Message field instead.
// Only fill these in once the property has been ADDED TO THE FORM,
// or HubSpot will reject the submission.
const HUBSPOT_SPEND_FIELD = "";       // e.g. "monthly_google_ads_spend"
const HUBSPOT_CUSTOMER_ID_FIELD = ""; // e.g. "google_ads_customer_id"

// Tried in order. The second is HubSpot's regional (na2) address,
// used only if the first one doesn't recognize the form.
const HUBSPOT_HOSTS = ["api.hsforms.com", "api-na2.hsforms.com"];

const PHONE = "(708) 529-1923";

function splitName(full) {
  const parts = full.trim().split(/\s+/);
  return { first: parts.shift() || "", last: parts.join(" ") };
}

function buildFields(form) {
  const data = new FormData(form);
  const get = (k) => (data.get(k) || "").toString().trim();
  const fields = [];
  const add = (name, value) => {
    if (value) fields.push({ objectTypeId: "0-1", name, value });
  };

  const { first, last } = splitName(get("name"));
  add("firstname", first);
  add("lastname", last);
  add("email", get("email"));
  add("phone", get("phone"));
  add("company", get("business"));
  add("website", get("website"));

  const noteLines = [`Form: ${get("form")}`];
  const spend = get("monthly_spend");
  const cid = get("customer_id");
  if (spend) {
    if (HUBSPOT_SPEND_FIELD) add(HUBSPOT_SPEND_FIELD, spend);
    else noteLines.push(`Monthly Google Ads spend: ${spend}`);
  }
  if (cid) {
    if (HUBSPOT_CUSTOMER_ID_FIELD) add(HUBSPOT_CUSTOMER_ID_FIELD, cid);
    else noteLines.push(`Google Ads customer ID: ${cid}`);
  }
  const msg = get("message");
  if (msg) noteLines.push("", msg);
  add("message", noteLines.join("\n"));

  return fields;
}

async function submitToHubSpot(fields) {
  // Links the lead to the visitor's HubSpot browsing history, when the
  // HubSpot tracking code has set its cookie.
  const hutk = document.cookie.match(/(?:^|; )hubspotutk=([^;]+)/)?.[1];
  const context = { pageUri: location.href, pageName: document.title };
  if (hutk) context.hutk = hutk;
  const body = JSON.stringify({ fields, context });
  let last;
  for (const host of HUBSPOT_HOSTS) {
    try {
      const res = await fetch(
        `https://${host}/submissions/v3/integration/submit/${HUBSPOT_PORTAL_ID}/${HUBSPOT_FORM_ID}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body }
      );
      if (res.ok) return { ok: true };
      let json = {};
      try { json = await res.json(); } catch {}
      last = { ok: false, status: res.status, errors: json.errors || [] };
      if (res.status !== 404) return last; // form found, but submission rejected
    } catch (err) {
      last = { ok: false, status: 0, errors: [] };
    }
  }
  return last;
}

document.querySelectorAll("form[data-form]").forEach((form) => {
  const status = form.querySelector(".form-status");
  const button = form.querySelector('button[type="submit"]');
  const label = button.textContent;

  const show = (msg, kind) => {
    status.textContent = msg;
    status.className = "form-status " + kind;
    status.hidden = false;
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Honeypot: bots fill this hidden field; people never see it.
    if (form.querySelector('[name="_gotcha"]')?.value) return;

    const missing = [...form.querySelectorAll("[required]")].find((el) => !el.value.trim());
    if (missing) {
      const name = form.querySelector(`label[for="${missing.id}"]`)?.childNodes[0]?.textContent.trim() || "This field";
      show(`${name} is required.`, "err");
      missing.focus();
      return;
    }
    const email = form.querySelector('input[type="email"]');
    if (email && email.value && !email.checkValidity()) {
      show("Enter a valid email address, like name@business.com.", "err");
      email.focus();
      return;
    }

    button.disabled = true;
    button.textContent = "Sending…";
    const result = await submitToHubSpot(buildFields(form));
    button.disabled = false;
    button.textContent = label;

    if (result.ok) {
      form.reset();
      show(
        form.dataset.form === "audit"
          ? "Audit request sent. We'll be in touch to get access to your account."
          : "Message sent. We'll get back to you soon.",
        "ok"
      );
      return;
    }

    const types = result.errors.map((x) => x.errorType);
    if (types.includes("INVALID_EMAIL") || types.includes("BLOCKED_EMAIL")) {
      show("That email address was rejected. Check it for typos, or text us at " + PHONE + ".", "err");
      email?.focus();
    } else {
      show(`That didn't go through. Try again, or text us at ${PHONE}.`, "err");
    }
  });
});

// ---------------------------------------------------------------
// Navigation: mobile menu button and dropdown menus
// ---------------------------------------------------------------
const nav = document.getElementById("main-nav");
const menuBtn = document.querySelector(".menu-toggle");
const subToggles = [...document.querySelectorAll(".sub-toggle")];

const closeSubmenus = (except) =>
  subToggles.forEach((b) => b !== except && b.setAttribute("aria-expanded", "false"));

menuBtn?.addEventListener("click", () => {
  const open = menuBtn.getAttribute("aria-expanded") !== "true";
  menuBtn.setAttribute("aria-expanded", String(open));
  menuBtn.textContent = open ? "Close" : "Menu";
  nav.classList.toggle("open", open);
});

subToggles.forEach((btn) => {
  btn.addEventListener("click", () => {
    const open = btn.getAttribute("aria-expanded") !== "true";
    closeSubmenus(btn);
    btn.setAttribute("aria-expanded", String(open));
  });
});

// Close dropdowns on outside click, on Escape, and when focus leaves them.
document.addEventListener("click", (e) => {
  if (!e.target.closest(".has-menu")) closeSubmenus();
});
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  const openBtn = subToggles.find((b) => b.getAttribute("aria-expanded") === "true");
  if (openBtn) { closeSubmenus(); openBtn.focus(); }
});
document.querySelectorAll(".has-menu").forEach((li) => {
  li.addEventListener("focusout", (e) => {
    if (!li.contains(e.relatedTarget)) li.querySelector(".sub-toggle")?.setAttribute("aria-expanded", "false");
  });
});

// ---------------------------------------------------------------
// Shared: monthly spend → the audit form's spend options
// ---------------------------------------------------------------
function spendBucket(n) {
  if (!n) return "Not running ads yet";
  if (n < 1000) return "Under $1,000";
  if (n <= 5000) return "$1,000 to $5,000";
  if (n <= 20000) return "$5,000 to $20,000";
  return "More than $20,000";
}
const usd = (n, digits = 0) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

// ---------------------------------------------------------------
// Cost per lead calculator
// ---------------------------------------------------------------
(() => {
  const root = document.getElementById("calc");
  if (!root) return;
  const $ = (id) => document.getElementById(id);
  const num = (id) => {
    const v = parseFloat($(id).value);
    return Number.isFinite(v) && v >= 0 ? v : NaN;
  };
  const dash = "—";

  function update() {
    const spend = num("calc-spend"), leads = num("calc-leads");
    const close = num("calc-close"), value = num("calc-value");
    const drop = parseInt($("calc-drop").value, 10);
    $("drop-out").textContent = drop + "%";

    const hasBasics = spend > 0 && leads > 0;
    const hasClose = hasBasics && close > 0;
    const hasValue = hasClose && value > 0;
    const cpl = hasBasics ? spend / leads : NaN;
    const customers = hasClose ? leads * (close / 100) : NaN;
    const revenue = hasValue ? customers * value : NaN;

    $("calc-status").textContent = !hasBasics
      ? "Enter your ad spend and leads"
      : !hasValue ? "Add close rate and customer value for the rest" : "Based on your numbers";
    $("out-cpl").textContent = hasBasics ? usd(cpl, cpl < 100 ? 2 : 0) : dash;
    $("out-cpa").textContent = hasClose ? usd(spend / customers) : dash;
    $("out-rev").textContent = hasValue ? usd(revenue) + " a month" : dash;
    $("out-roas").textContent = hasValue ? usd(revenue / spend, 2) + " back for every $1" : dash;

    // What-if: same budget at a lower cost per lead
    if (hasBasics) {
      const newLeads = spend / (cpl * (1 - drop / 100));
      $("wi-leads").textContent = `${Math.round(newLeads)} (+${Math.round(newLeads - leads)})`;
      const extraCust = hasClose ? (newLeads - leads) * (close / 100) : NaN;
      $("wi-cust").textContent = hasClose ? (extraCust < 10 ? extraCust.toFixed(1) : Math.round(extraCust)) : dash;
      $("wi-rev").textContent = hasValue ? usd(extraCust * value) : dash;
    } else {
      ["wi-leads", "wi-cust", "wi-rev"].forEach((id) => ($(id).textContent = dash));
    }

    // Hand the numbers to the audit form
    const params = new URLSearchParams({ from: "calculator" });
    if (Number.isFinite(spend)) params.set("spend", spendBucket(spend));
    if (hasBasics) {
      const lines = [`From the cost per lead calculator: ${usd(spend)}/month spend, ${leads} leads/month, cost per lead ${usd(cpl, 2)}.`];
      if (hasClose) lines.push(`About ${close}% of leads become customers.`);
      if (hasValue) lines.push(`Average customer value ${usd(value)}.`);
      params.set("msg", lines.join(" "));
    }
    $("calc-cta").href = "/audit?" + params.toString();
  }

  root.addEventListener("input", update);
  update();
})();

// ---------------------------------------------------------------
// Google Ads checkup
// ---------------------------------------------------------------
(() => {
  const form = document.getElementById("checkup-form");
  if (!form) return;
  const issues = JSON.parse(document.getElementById("checkup-issues").textContent);
  const results = document.getElementById("checkup-results");
  const error = document.getElementById("checkup-error");
  const keys = [...form.querySelectorAll("fieldset.q")].map((f) => f.dataset.key);

  form.addEventListener("change", () => { error.hidden = true; });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const answers = Object.fromEntries(keys.map((k) => [k, form.querySelector(`input[name="${k}"]:checked`)?.value]));
    const missing = keys.filter((k) => !answers[k]);
    if (missing.length) {
      error.textContent = missing.length === 1
        ? "Answer the last question to see your results. \"Not sure\" is a fine answer."
        : `Answer all ${keys.length} questions to see your results. ${missing.length} still need an answer. "Not sure" is a fine answer.`;
      error.hidden = false;
      form.querySelector(`fieldset[data-key="${missing[0]}"] input`).focus();
      return;
    }

    const problems = keys.filter((k) => answers[k] !== "yes");
    const good = keys.length - problems.length;
    document.getElementById("score-num").textContent = good;
    const [head, text] =
      good >= 7 ? ["Your account looks to be in good shape.", "Your setup covers the basics most accounts miss. An audit can still find savings in bidding, ads, and landing pages."]
      : good >= 4 ? ["There are some leaks worth fixing.", "Your account has a solid start, but these gaps commonly waste budget or hide your real results."]
      : ["Your account is likely wasting money.", "These are some of the most common and most expensive gaps in Google Ads accounts, and they're usually fixable."];
    document.getElementById("score-head").textContent = head;
    document.getElementById("score-text").textContent = text;

    const list = document.getElementById("issue-list");
    list.innerHTML = "";
    problems.forEach((k) => {
      const li = document.createElement("li");
      const div = document.createElement("div");
      const strong = document.createElement("strong");
      strong.textContent = issues[k].title + (answers[k] === "unsure" ? " (you weren't sure)" : "");
      const span = document.createElement("span");
      span.textContent = issues[k].text;
      div.append(strong, span);
      li.append(div);
      list.append(li);
    });

    const params = new URLSearchParams({ from: "checkup" });
    params.set("msg", problems.length
      ? `From the Google Ads checkup (${good} of 8 in good shape). Possible issues: ${problems.map((k) => issues[k].title).join("; ")}.`
      : "From the Google Ads checkup: 8 of 8 in good shape.");
    document.getElementById("checkup-cta").href = "/audit?" + params.toString();

    form.hidden = true;
    results.hidden = false;
    results.focus();
    results.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  });

  document.getElementById("checkup-restart").addEventListener("click", () => {
    form.reset();
    results.hidden = true;
    form.hidden = false;
    form.querySelector("input").focus();
  });
})();

// ---------------------------------------------------------------
// Audit form: prefill from the calculator or checkup
// ---------------------------------------------------------------
(() => {
  const form = document.getElementById("audit-form");
  if (!form) return;
  const params = new URLSearchParams(location.search);
  const spend = params.get("spend"), msg = params.get("msg");
  const select = form.querySelector("#spend");
  if (spend && [...select.options].some((o) => o.value === spend || o.text === spend)) select.value = spend;
  if (msg) form.querySelector("#message").value = msg.slice(0, 1000);
  if (spend || msg) {
    const note = document.createElement("p");
    note.className = "prefill-note";
    note.textContent = "We've added your results below. Fill in your contact details and send.";
    form.prepend(note);
  }
})();
