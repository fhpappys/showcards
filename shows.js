/* =========================================================
   FH Pappy's — Frontend Show Cards Renderer
   ========================================================= */

const upcomingEl = document.getElementById("upcomingShows");
const pastEl = document.getElementById("pastShows");
const togglePastBtn = document.getElementById("togglePast");
const pastChevron = document.getElementById("pastChevron");

/* Escape text to avoid HTML injection */
function esc(str) {
  return String(str || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

/* Format date safely + append Doors / Price */
function formatDate(iso, doors, price) {
  const extras = [
    doors ? `Doors ${doors}` : null,
    price ? price : null,
  ].filter(Boolean).join(" • ");

  // Airtable date-only: YYYY-MM-DD → local date (prevents timezone shift)
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split("-").map(Number);
    const local = new Date(y, m - 1, d);

    const datePart = local.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return extras ? `${datePart} • ${extras}` : datePart;
  }

  // Date + time
  const dt = new Date(iso);
  const dateTimePart = dt.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return extras ? `${dateTimePart} • ${extras}` : dateTimePart;
}

/* Render a single show card */
function renderCard(show) {
  const loc = [show.city, show.state].filter(Boolean).join(", ");

  const flyer = show.flyerUrl
    ? `<img class="show-flyer"
             src="${show.flyerUrl}"
             alt="Flyer for ${esc(show.band)}"
             loading="lazy">`
    : "";

  const actions =
    show.ticketUrl || show.moreInfoUrl
      ? `<div class="show-actions">
          ${show.ticketUrl
            ? `<a class="show-btn" href="${show.ticketUrl}" target="_blank" rel="noopener">Tickets</a>`
            : ""}
          ${show.moreInfoUrl
            ? `<a class="show-btn" href="${show.moreInfoUrl}" target="_blank" rel="noopener">Info</a>`
            : ""}
        </div>`
      : "";

  return `
    <article class="show-card">
      ${flyer}
      <div class="show-body">
        <p class="show-date">
          ${esc(formatDate(show.date, show.doors, show.price))}
        </p>

        ${show.band ? `<p class="show-band">${esc(show.band)}</p>` : ""}
        ${show.venue ? `<p class="show-venue">${esc(show.venue)}</p>` : ""}
        ${loc ? `<p class="show-loc">${esc(loc)}</p>` : ""}

        ${show.notes ? `<div class="show-notes">${esc(show.notes)}</div>` : ""}
        ${actions}
      </div>
    </article>
  `;
}

/* Load shows from Netlify Function */
async function loadShows() {
  if (!upcomingEl || !pastEl) {
    console.error("Show containers not found in HTML.");
    return;
  }

  upcomingEl.innerHTML = `<p class="small">Loading shows…</p>`;

  try {
    const res = await fetch("/.netlify/functions/shows", { cache: "no-store" });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

    const data = await res.json();

    // Upcoming
    upcomingEl.innerHTML =
      data.upcoming && data.upcoming.length
        ? data.upcoming.map(renderCard).join("")
        : `<p class="small">No upcoming shows announced yet.</p>`;

    // Past
    pastEl.innerHTML =
      data.past && data.past.length
        ? data.past.map(renderCard).join("")
        : `<p class="small">No past shows yet.</p>`;

    // Hide Past Shows header if empty
    if (togglePastBtn) {
      togglePastBtn.style.display =
        data.past && data.past.length ? "flex" : "none";
    }

  } catch (err) {
    console.error("Show load error:", err);
    upcomingEl.innerHTML = `<p class="small">Unable to load shows.</p>`;
  }
}

/* Toggle Past Shows section */
if (togglePastBtn && pastEl) {
  togglePastBtn.addEventListener("click", () => {
    const hidden = pastEl.classList.toggle("is-hidden");
    if (pastChevron) pastChevron.textContent = hidden ? "▾" : "▴";
  });
}

/* Init */
loadShows();
