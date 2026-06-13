export function printKOT(kotData) {
  const { kotNumber, table, section, captain, items, createdAt, restaurantName } = kotData;
  const win = window.open('', '_blank', 'width=400,height=600');
  if (!win) return;

  const timeStr = createdAt ? new Date(createdAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN');

  win.document.write(`
<!DOCTYPE html>
<html>
<head>
  <title>KOT ${kotNumber || ''}</title>
  <style>
    @media print { @page { margin: 0; size: 80mm auto; } }
    body { font-family: 'Courier New', monospace; width: 302px; margin: 0 auto; padding: 8px; font-size: 13px; line-height: 1.4; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .big { font-size: 18px; }
    .dashed { border-top: 2px dashed #000; margin: 8px 0; }
    .item { display: flex; justify-content: space-between; margin: 4px 0; }
    .note { font-size: 11px; font-style: italic; padding-left: 12px; }
    .footer { margin-top: 12px; font-size: 11px; text-align: center; }
  </style>
</head>
<body>
  <div class="center bold big">${restaurantName || 'Restaurant'}</div>
  <div class="center" style="font-size:11px;margin:4px 0;">KITCHEN ORDER TICKET</div>
  <div class="dashed"></div>
  <div><span class="bold">KOT #:</span> ${kotNumber || '-'}</div>
  <div><span class="bold">Table:</span> ${table || '-'} | ${section || ''}</div>
  <div><span class="bold">Captain:</span> ${captain || '-'}</div>
  <div class="dashed"></div>
  <div class="bold" style="margin-bottom:4px;">Items:</div>
  ${items.map(it => `
    <div class="item">
      <span>${it.qty || 1} x ${it.name}</span>
    </div>
    ${it.note ? `<div class="note">Note: ${it.note}</div>` : ''}
  `).join('')}
  <div class="dashed"></div>
  <div class="footer">${timeStr}</div>
</body>
</html>
  `);
  win.document.close();
  setTimeout(() => win.print(), 300);
}

export function printBill(billData) {
  const {
    billNumber, table, section, items,
    subtotal, cgst, sgst, total, paymentMode,
    restaurantName, restaurantAddress, gstin,
    cashierName, createdAt
  } = billData;

  const win = window.open('', '_blank', 'width=400,height=700');
  if (!win) return;

  const timeStr = createdAt ? new Date(createdAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN');

  win.document.write(`
<!DOCTYPE html>
<html>
<head>
  <title>Bill ${billNumber || ''}</title>
  <style>
    @media print { @page { margin: 0; size: 80mm auto; } }
    body { font-family: 'Courier New', monospace; width: 302px; margin: 0 auto; padding: 8px; font-size: 13px; line-height: 1.4; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .big { font-size: 16px; }
    .dashed { border-top: 1px dashed #000; margin: 8px 0; }
    .line { display: flex; justify-content: space-between; margin: 3px 0; }
    .right { text-align: right; }
    .total { font-size: 16px; font-weight: bold; border-top: 2px solid #000; padding-top: 4px; margin-top: 4px; }
    .footer { margin-top: 16px; text-align: center; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { text-align: left; padding: 2px 0; }
    th:last-child, td:last-child { text-align: right; }
  </style>
</head>
<body>
  <div class="center bold big">${restaurantName || 'Restaurant'}</div>
  ${restaurantAddress ? `<div class="center" style="font-size:11px;">${restaurantAddress}</div>` : ''}
  ${gstin ? `<div class="center" style="font-size:11px;">GSTIN: ${gstin}</div>` : ''}
  <div class="dashed"></div>
  <div class="line"><span class="bold">BILL #</span><span>${billNumber || '-'}</span></div>
  <div class="line"><span>Table</span><span>${table || '-'} ${section ? '(' + section + ')' : ''}</span></div>
  <div class="line"><span>Date/Time</span><span>${timeStr}</span></div>
  ${cashierName ? `<div class="line"><span>Cashier</span><span>${cashierName}</span></div>` : ''}
  <div class="dashed"></div>
  <table>
    <tr><th>Item</th><th>Qty</th><th>Amt</th></tr>
    ${items.map(it => `
      <tr>
        <td>${it.name}</td>
        <td>${it.qty}</td>
        <td>₹${(it.price * it.qty).toFixed(2)}</td>
      </tr>
    `).join('')}
  </table>
  <div class="dashed"></div>
  <div class="line"><span>Subtotal</span><span>₹${(subtotal || 0).toFixed(2)}</span></div>
  <div class="line"><span>CGST (2.5%)</span><span>₹${(cgst || 0).toFixed(2)}</span></div>
  <div class="line"><span>SGST (2.5%)</span><span>₹${(sgst || 0).toFixed(2)}</span></div>
  <div class="line total"><span>GRAND TOTAL</span><span>₹${(total || 0).toFixed(2)}</span></div>
  ${paymentMode ? `<div class="line" style="margin-top:4px;"><span>Payment</span><span class="bold">${paymentMode.toUpperCase()}</span></div>` : ''}
  <div class="footer">
    <div style="margin-top:8px;">Thank you, visit again!</div>
  </div>
</body>
</html>
  `);
  win.document.close();
  setTimeout(() => win.print(), 300);
}
