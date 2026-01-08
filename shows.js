shows// Frontend show renderer for FH Pappy's

const upcomingEl = document.getElementById("upcomingShows");
const pastEl = document.getElementById("pastShows");
const togglePastBtn = document.getElementById("togglePast");
const pastChevron = document.getElementById("pastChevron");

// Format date nicely (York-friendly)
function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Escape text to avoid accidental HTML injection
function esc(str) {
  return String(str || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

// Build a single show card
function renderCard(show) {
  const loc = [show.city, show.state].filter(Boolean).join(", ");
  const flyer = show.flyerUrl
    ? `<img class="show-flyer" src="${show.flyerUrl}" alt="Flyer for ${esc(show.band)}" loading="lazy">`
    : "";

  const actions =
    show.ticketUrl || show.moreInfoUrl
      ? `<div class="show-actions">
          ${show.ticketUrl ? `<a class="show-btn" href="${show.ticketUrl}" target="_blank" rel="noopener">Tickets</a>` : ""}
          ${show.moreInfoUrl ? `<a class="show-btn" href="${show.moreInfoUrl}" target="_blank" rel="noopener">Info</a>` : ""}
        </div>`
      : "";

  return `
    <article class="show-card">
      ${flyer}
      <div class="show-body">
        <p class="show-date">${esc(formatDate(show.date))}</p>
        ${show.band ? `<p class="show-band">${esc(show.band)}</p>` : ""}
        ${show.venue ? `<p class="show-venue">${esc(show.venue)}</p>` : ""}
        ${loc ? `<p class="show-loc">${esc(loc)}</p>` : ""}
        ${show.notes ? `<div class="show-notes">${esc(show.notes)}</div>` : ""}
        ${actions}
      </div>
    </article>
  `;
}

// Load shows from Netlify function
async function loadShows() {
  try {
    const res = await fetch("/.netlify/functions/shows");
    const data = await res.json();

    upcomingEl.innerHTML =
      data.upcoming && data.upcoming.length
        ? data.upcoming.map(renderCard).join("")
        : `<p class="small">No upcoming shows announced yet.</p>`;

    pastEl.innerHTML =
      data.past && data.past.length
        ? data.past.map(renderCard).join("")
        : `<p class="small">No past shows yet.</p>`;
  } catch (err) {
    upcomingEl.innerHTML = `<p class="small">Unable to load shows.</p>`;
    console.error("Show load error:", err);
  }
}

// Toggle past shows open/closed
if (togglePastBtn) {
  togglePastBtn.addEventListener("click", () => {
    const hidden = pastEl.classList.toggle("is-hidden");
    if (pastChevron) pastChevron.textContent = hidden ? "▾" : "▴";
  });
}

loadShows();
