export default async () => {
  try {
    const {
      AIRTABLE_API_KEY,
      AIRTABLE_BASE_ID,
      AIRTABLE_TABLE_NAME = "Shows",
      AIRTABLE_VIEW = "Grid view",
    } = process.env;

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      return new Response(JSON.stringify({ error: "Missing Airtable env vars." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(
        AIRTABLE_TABLE_NAME
      )}`
    );
    url.searchParams.set("view", AIRTABLE_VIEW);
    url.searchParams.set("sort[0][field]", "Date");
    url.searchParams.set("sort[0][direction]", "asc");

    const r = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
    });

    if (!r.ok) {
      const text = await r.text();
      return new Response(JSON.stringify({ error: "Airtable error", details: text }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await r.json();

    // "Now" in America/New_York (matches your real-world expectation)
    const nowNY = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/New_York" })
    );

    const clean = (v) => (typeof v === "string" ? v.trim() : v);

    const records = (data.records || [])
      .map((rec) => {
        const f = rec.fields || {};

        const flyerUrl =
          Array.isArray(f.Flyer) && f.Flyer[0]
            ? (f.Flyer[0].thumbnails?.large?.url || f.Flyer[0].url)
            : null;

        const band = clean(f.Band || f.Title || "");
        const venue = clean(f.Venue || "");
        const city = clean(f.City || "");
        const state = clean(f.State || "");
        const ticketUrl = clean(f.TicketURL || "");
        const moreInfoUrl = clean(f.MoreInfoURL || "");
        const notes = clean(f.Notes || "");
        const doors = clean(f.Doors || "");
        const price = clean(f.Price || "");



        return {
          id: rec.id,
          date: f.Date || null,
          doors,
          price,
          band,
          venue,
          city,
          state,
          ticketUrl,
          moreInfoUrl,
          notes,
          flyerUrl,
        };
      })
      .filter((x) => x.date);

    const upcoming = records.filter((x) => new Date(x.date) >= nowNY);
    const past = records.filter((x) => new Date(x.date) < nowNY).reverse();

    return new Response(JSON.stringify({ upcoming, past }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Server error", details: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

