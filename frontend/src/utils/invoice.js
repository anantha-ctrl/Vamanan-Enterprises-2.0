// Shared tax-invoice generator (CGST + SGST split).
// GST is split equally into CGST + SGST (intra-state). Cashback is shown as based on the
// taxable product value only — GST is excluded from every incentive calculation.
//
// items:    [{ name, qty, rate, base, gstRate }]   base = taxable value (ex-GST) for that line
// customer: { name, customerId, phone, utr, paymentMethod, companyName, companyAddress }
export function generateInvoice(invoiceNo, items, customer = {}) {
  const esc = (v) => (v === null || v === undefined || v === '') ? '—' : String(v).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const money = (v) => '₹' + Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Group taxable value by GST rate so CGST/SGST can be shown per slab.
  const groups = {};
  let totalTaxable = 0, totalCgst = 0, totalSgst = 0;
  items.forEach(it => {
    const r = Number(it.gstRate) || 0;
    if (!groups[r]) groups[r] = { rate: r, taxable: 0 };
    groups[r].taxable += it.base;
    totalTaxable += it.base;
  });
  Object.values(groups).forEach(g => {
    g.cgst = g.taxable * (g.rate / 2) / 100;
    g.sgst = g.taxable * (g.rate / 2) / 100;
    totalCgst += g.cgst;
    totalSgst += g.sgst;
  });
  const grandTotal = totalTaxable + totalCgst + totalSgst;

  const itemRows = items.map((it, i) => `
    <tr>
      <td class="c">${i + 1}</td>
      <td>${esc(it.name)}</td>
      <td class="c">${esc(it.qty)}</td>
      <td class="r">${money(it.rate)}</td>
      <td class="c">${(Number(it.gstRate) || 0)}%</td>
      <td class="r">${money(it.base)}</td>
    </tr>`).join('');

  const taxRows = Object.values(groups).map(g => `
    <tr>
      <td class="c">${g.rate}%</td>
      <td class="r">${money(g.taxable)}</td>
      <td class="c">${(g.rate / 2)}%</td>
      <td class="r">${money(g.cgst)}</td>
      <td class="c">${(g.rate / 2)}%</td>
      <td class="r">${money(g.sgst)}</td>
    </tr>`).join('');

  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const win = window.open('', '_blank', 'width=900,height=1000');
  if (!win) { alert('Allow pop-ups to view your invoice.'); return false; }
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Tax Invoice ${esc(invoiceNo)}</title>
    <style>
      * { box-sizing: border-box; }
      @page { size: A4; margin: 12mm; }
      html, body { margin: 0; padding: 0; }
      body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .sheet { max-width: 720px; margin: 0 auto; }
      .head { display:flex; align-items:flex-start; justify-content:space-between; border-bottom:3px solid #0f172a; padding-bottom:12px; margin-bottom:10px; }
      .brand { font-size:22px; font-weight:800; letter-spacing:-0.5px; text-transform:uppercase; font-style:italic; }
      .brand span { color:#d97706; }
      .sub { font-size:9px; letter-spacing:2px; text-transform:uppercase; color:#64748b; font-weight:700; margin-top:2px; }
      .title { text-align:right; }
      .title h1 { font-size:18px; margin:0; text-transform:uppercase; letter-spacing:1px; }
      .title .meta { font-size:10px; color:#475569; line-height:1.6; margin-top:4px; }
      .billto { font-size:11px; color:#334155; margin:10px 0 14px; line-height:1.6; }
      .billto b { text-transform:uppercase; font-size:9px; letter-spacing:1px; color:#64748b; }
      table { width:100%; border-collapse:collapse; margin-bottom:12px; }
      th, td { border:1px solid #e2e8f0; padding:7px 9px; font-size:11px; }
      th { background:#0f172a; color:#fff; text-transform:uppercase; font-size:9px; letter-spacing:0.5px; }
      td.c { text-align:center; } td.r { text-align:right; }
      .totals { width:55%; margin-left:auto; }
      .totals td { font-size:12px; }
      .totals tr:last-child td { font-weight:800; background:#fef3c7; font-size:13px; }
      .note { font-size:9px; color:#64748b; line-height:1.6; margin-top:14px; border-top:1px dashed #cbd5e1; padding-top:10px; }
      .sign { display:flex; justify-content:space-between; margin-top:40px; }
      .sign div { width:42%; border-top:1px solid #0f172a; padding-top:6px; font-size:9px; text-transform:uppercase; letter-spacing:1px; color:#475569; text-align:center; }
    </style></head><body>
    <div class="sheet">
      <div class="head">
        <div>
          <div class="brand">Vamanan <span>Enterprises V</span></div>
          <div class="sub">${esc(customer.companyAddress || 'Krishnagiri, Tamil Nadu')}</div>
        </div>
        <div class="title">
          <h1>Tax Invoice</h1>
          <div class="meta">Invoice No: <b>INV-${esc(invoiceNo)}</b><br/>Date: ${esc(today)}<br/>Payment: ${esc(customer.paymentMethod)}</div>
        </div>
      </div>
      <div class="billto">
        <b>Bill To</b><br/>
        ${esc(customer.name)}<br/>
        ${customer.customerId ? 'Customer ID: ' + esc(customer.customerId) + '<br/>' : ''}
        Phone: ${esc(customer.phone)}${customer.utr ? '<br/>Txn / UTR: ' + esc(customer.utr) : ''}
      </div>
      <table>
        <thead><tr><th>#</th><th>Description</th><th>Qty</th><th>Rate</th><th>GST</th><th>Taxable Value</th></tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
      <table>
        <thead><tr><th>GST Rate</th><th>Taxable</th><th>CGST %</th><th>CGST Amt</th><th>SGST %</th><th>SGST Amt</th></tr></thead>
        <tbody>${taxRows}</tbody>
      </table>
      <table class="totals">
        <tr><td>Taxable Amount</td><td class="r">${money(totalTaxable)}</td></tr>
        <tr><td>CGST</td><td class="r">${money(totalCgst)}</td></tr>
        <tr><td>SGST</td><td class="r">${money(totalSgst)}</td></tr>
        <tr><td>Total Amount</td><td class="r">${money(grandTotal)}</td></tr>
      </table>
      <div class="note">
        Cashback is calculated only on the taxable product value (${money(totalTaxable)}); GST (CGST + SGST) is excluded from all cashback, referral and commission calculations.<br/>
        This is a computer-generated tax invoice.
      </div>
      <div class="sign"><div>Customer Signature</div><div>For ${esc(customer.companyName || 'Vamanan Enterprises V')}</div></div>
    </div>
    </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
  return true;
}

// Rebuild an invoice from a stored order row (cashback_cycles). Derives the GST rate
// from the stored gst_amount / product_amount so the CGST/SGST split stays accurate.
export function invoiceFromOrder(order, customer = {}) {
  const base = parseFloat(order.product_amount ?? order.cashback_eligible_amount ?? order.total_value ?? 0);
  const gst = parseFloat(order.gst_amount ?? 0);
  const gstRate = base > 0 ? Math.round((gst / base) * 100) : 0;
  const items = [{
    name: order.cycle_product_name || order.product_name || `Order #${order.id}`,
    qty: parseFloat(order.weight) > 1 ? order.weight : 1,
    rate: base,
    base,
    gstRate,
  }];
  return generateInvoice(order.id, items, {
    ...customer,
    utr: order.transaction_id || customer.utr,
    paymentMethod: order.payment_method || customer.paymentMethod || 'Bank Transfer',
  });
}
