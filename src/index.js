export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/contact" && request.method === "POST") {
      try {
        const data = await request.json();

        const name = (data.name || "").trim();
        const company = (data.company || "").trim();
        const preferredTime = (data.preferred_time || "").trim();
        const contactMethod = (data.contact_method || "").trim();
        const email = (data.email || "").trim();
        const phone = (data.phone || "").trim();
        const message = (data.message || "").trim();

        if (!name || !email || !message) {
          return Response.json(
            { success: false, error: "Missing required fields." },
            { status: 400 }
          );
        }

        const escapeHtml = (value = "") =>
          value
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

        const emailHtml = `
          <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#111;">
            <h2 style="margin-bottom:30px;">New HiJames Conversation</h2>

            <p><strong>01 — WHO'S TALKING?</strong><br>
            ${escapeHtml(name)}<br>
            ${escapeHtml(company || "Not provided")}</p>

            <p><strong>02 — PERFECT TIME</strong><br>
            ${escapeHtml(preferredTime || "Not provided")}</p>

            <p><strong>03 — HOW TO TALK</strong><br>
            ${escapeHtml(contactMethod || "Not provided")}<br>
            ${escapeHtml(email)}<br>
            ${escapeHtml(phone || "Not provided")}</p>

            <p><strong>04 — WHAT'S ON THEIR MIND?</strong><br>
            ${escapeHtml(message).replaceAll("\n", "<br>")}</p>

            <hr style="border:0;border-top:1px solid #eee;margin:30px 0;">
            <p style="font-size:12px;color:#777;">Submitted through HiJames.io</p>
          </div>
        `;

        const resendResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: "HiJames <notifications@hijames.io>",
            to: ["hellomove37studio@gmail.com"],
            reply_to: email,
            subject: `HiJames — ${name}`,
            html: emailHtml
          })
        });

        if (!resendResponse.ok) {
          const error = await resendResponse.text();
          console.error("Resend error:", error);

          return Response.json(
            { success: false, error: "Email could not be sent." },
            { status: 500 }
          );
        }

        return Response.json({ success: true });
      } catch (error) {
        console.error(error);

        return Response.json(
          { success: false, error: "Unexpected error." },
          { status: 500 }
        );
      }
    }

    return new Response("Not found", { status: 404 });
  }
};
