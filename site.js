// ---------------------------------------------------------------
// FORM SETUP: paste your form endpoint between the quotes below.
// Works with Formspree (https://formspree.io) or any service that
// accepts a POST of form data and returns JSON.
// Example: "https://formspree.io/f/abcd1234"
// Until this is set, forms tell visitors to call instead.
// ---------------------------------------------------------------
const FORM_ENDPOINT = "";

const PHONE = "(708) 529-1923";

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

    if (!FORM_ENDPOINT) {
      show(`Online requests aren't set up yet. Call us at ${PHONE} and we'll take your details over the phone.`, "err");
      return;
    }

    button.disabled = true;
    button.textContent = "Sending…";
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(res.status);
      form.reset();
      show(
        form.dataset.form === "audit"
          ? "Audit request sent. We'll be in touch to get access to your account."
          : "Message sent. We'll get back to you soon.",
        "ok"
      );
    } catch {
      show(`That didn't go through. Try again, or call us at ${PHONE}.`, "err");
    } finally {
      button.disabled = false;
      button.textContent = label;
    }
  });
});
