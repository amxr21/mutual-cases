/**
 * Email templates (inline-styled for broad email-client compatibility — Gmail,
 * Outlook, Apple Mail all strip <style> blocks, so styles live on elements).
 * Brand palette: blue #055AB0, gold #DFA61D, off-white #F8F8F5.
 */

const STATUS_COPY = {
    Pending: "We've received your order and it's awaiting confirmation.",
    Confirmed: "Your order is confirmed and being prepared.",
    Shipped: "Good news — your order is on its way!",
    Delivered: "Your order has been delivered. Enjoy your Mutual cover!",
    Canceled: "Your order has been canceled. If this is unexpected, please contact us.",
    Returned: "Your return has been processed.",
};

const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

/**
 * Order status-change email.
 * @param {object} o  { orderNumber, status, customerName, total, items:[{model,category,quantity,price}], trackUrl }
 */
function orderStatusEmail(o) {
    const itemsRows = (o.items || [])
        .map(
            (it) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;color:#2C2C2C;font-size:14px;">
            ${esc(it.category)} ${esc(it.model)} <span style="color:#888;">×${esc(it.quantity)}</span>
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;color:#2C2C2C;font-size:14px;text-align:right;white-space:nowrap;">
            ${esc(Number(it.price) * Number(it.quantity))} AED
          </td>
        </tr>`
        )
        .join("");

    const intro = STATUS_COPY[o.status] || `Your order status is now: ${esc(o.status)}.`;

    const subject = `Your Mutual order ${o.orderNumber} is now ${o.status}`;

    const html = `
  <div style="background:#f4f6fb;padding:24px 0;font-family:Georgia,'Times New Roman',serif;">
    <div style="max-width:560px;margin:0 auto;background:#F8F8F5;border-radius:16px;overflow:hidden;border:1px solid #e7e9ef;">
      <div style="background:#055AB0;padding:28px 32px;text-align:center;">
        <div style="color:#F8F8F5;font-size:28px;font-weight:bold;letter-spacing:1px;">Mutual</div>
      </div>
      <div style="padding:32px;">
        <div style="display:inline-block;background:rgba(5,90,176,0.1);color:#055AB0;font-size:13px;font-weight:bold;padding:6px 14px;border-radius:999px;">
          ${esc(o.status)}
        </div>
        <h1 style="color:#2C2C2C;font-size:22px;margin:16px 0 8px;">Hi ${esc(o.customerName || "there")},</h1>
        <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px;">${intro}</p>

        <div style="background:#fff;border:1px solid #eee;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
          <p style="margin:0 0 4px;color:#888;font-size:13px;">Order number</p>
          <p style="margin:0;color:#2C2C2C;font-size:18px;font-weight:bold;">${esc(o.orderNumber)}</p>
          <table style="width:100%;border-collapse:collapse;margin-top:16px;">${itemsRows}</table>
          <div style="display:flex;justify-content:space-between;margin-top:14px;padding-top:12px;border-top:2px solid #eee;">
            <span style="color:#2C2C2C;font-size:16px;font-weight:bold;">Total</span>
            <span style="color:#055AB0;font-size:16px;font-weight:bold;float:right;">${esc(o.total)} AED</span>
          </div>
        </div>

        <a href="${esc(o.trackUrl)}" style="display:block;background:#055AB0;color:#F8F8F5;text-decoration:none;text-align:center;font-weight:bold;font-size:16px;padding:14px;border-radius:10px;">
          Track your order
        </a>
      </div>
      <div style="padding:20px 32px;text-align:center;border-top:1px solid #eee;">
        <p style="margin:0;color:#aaa;font-size:12px;">Mutual — More than just a case. · Established in 2024, AD, UAE</p>
      </div>
    </div>
  </div>`;

    const text = `Hi ${o.customerName || "there"},\n\n${intro}\n\nOrder: ${o.orderNumber}\nStatus: ${o.status}\nTotal: ${o.total} AED\n\nTrack your order: ${o.trackUrl}\n\n— Mutual`;

    return { subject, html, text };
}

/**
 * Back-in-stock notification email.
 * @param {object} o  { product:{ model, category }, url }
 */
function backInStockEmail(o) {
    const name = esc(`${o.product.category} ${o.product.model}`);
    const subject = `Back in stock: ${o.product.category} ${o.product.model}`;
    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;background:#F8F8F5;padding:24px;">
        <h2 style="color:#055AB0;margin:0 0 12px;">It's back in stock!</h2>
        <p style="color:#2C2C2C;font-size:15px;line-height:1.5;">
          Good news — <strong>${name}</strong> is available again. Grab it before it sells out.
        </p>
        <p style="margin:20px 0;">
          <a href="${esc(o.url)}" style="background:#055AB0;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold;font-size:14px;">View product</a>
        </p>
        <p style="color:#888;font-size:12px;">You're receiving this because you asked to be notified. You won't be emailed again for this product.</p>
      </div>`;
    const text = `It's back in stock! ${o.product.category} ${o.product.model} is available again: ${o.url}`;
    return { subject, html, text };
}

module.exports = { orderStatusEmail, backInStockEmail };
