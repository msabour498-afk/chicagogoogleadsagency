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
      show("That email address was rejected. Check it for typos, or call us at " + PHONE + ".", "err");
      email?.focus();
    } else {
      show(`That didn't go through. Try again, or call us at ${PHONE}.`, "err");
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
