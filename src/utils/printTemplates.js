// ESC/POS byte builder helpers
const ESC = 0x1B;
const GS = 0x1D;
const LF = 0x0A;
const INIT = [ESC, 0x40];
const BOLD_ON = [ESC, 0x45, 0x01];
const BOLD_OFF = [ESC, 0x45, 0x00];
const ALIGN_CENTER = [ESC, 0x61, 0x01];
const ALIGN_LEFT = [ESC, 0x61, 0x00];
const DOUBLE_HEIGHT_ON = [GS, 0x21, 0x01];
const DOUBLE_HEIGHT_OFF = [GS, 0x21, 0x00];
const CUT = [GS, 0x56, 0x41, 0x10];

function textToBytes(str) {
  return Array.from(new TextEncoder().encode(str));
}

function line(text = '') {
  return [...textToBytes(text), LF];
}

function dashedLine() {
  return line('--------------------------------');
}

function padRight(text, len) {
  return text.substring(0, len).padEnd(len, ' ');
}

function padLeft(text, len) {
  return text.substring(0, len).padStart(len, ' ');
}

export function buildKOTBytes(kotData) {
  const { kotNumber, table, section, captain, items, createdAt, restaurantName } = kotData;
  const timeStr = createdAt ? new Date(createdAt).toLocaleTimeString('en-IN') : new Date().toLocaleTimeString('en-IN');

  const bytes = [
    ...INIT,
    ...ALIGN_CENTER,
    ...BOLD_ON,
    ...DOUBLE_HEIGHT_ON,
    ...line(restaurantName || 'Restaurant'),
    ...DOUBLE_HEIGHT_OFF,
    ...BOLD_OFF,
    ...line('KITCHEN ORDER TICKET'),
    ...dashedLine(),
    ...ALIGN_LEFT,
    ...BOLD_ON,
    ...line(`KOT #: ${kotNumber || '-'}`),
    ...line(`Table: ${table || '-'}  ${section || ''}`),
    ...line(`Captain: ${captain || '-'}`),
    ...BOLD_OFF,
    ...dashedLine(),
    ...BOLD_ON,
    ...line('Items:'),
    ...BOLD_OFF,
  ];

  for (const item of items) {
    bytes.push(...line(`${item.qty || 1} x ${item.name}`));
    if (item.note) bytes.push(...line(`  >> ${item.note}`));
  }

  bytes.push(
    ...dashedLine(),
    ...line(timeStr),
    ...LF, ...LF, ...LF,
    ...CUT,
  );

  return new Uint8Array(bytes);
}

export function buildBillBytes(billData) {
  const { billNumber, table, section, items, subtotal, cgst, sgst, total,
    paymentMode, restaurantName, restaurantAddress, gstin, createdAt } = billData;
  const timeStr = createdAt ? new Date(createdAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN');
  const COL = 32;

  const bytes = [
    ...INIT,
    ...ALIGN_CENTER,
    ...BOLD_ON,
    ...DOUBLE_HEIGHT_ON,
    ...line(restaurantName || 'Restaurant'),
    ...DOUBLE_HEIGHT_OFF,
    ...BOLD_OFF,
  ];

  if (restaurantAddress) bytes.push(...line(restaurantAddress));
  if (gstin) bytes.push(...line(`GSTIN: ${gstin}`));

  bytes.push(
    ...dashedLine(),
    ...ALIGN_LEFT,
    ...line(`Bill #: ${billNumber || '-'}`),
    ...line(`Table : ${table || '-'} ${section ? '(' + section + ')' : ''}`),
    ...line(`Time  : ${timeStr}`),
    ...dashedLine(),
    ...line(`${padRight('Item', 18)} ${padRight('Qty', 4)} ${padLeft('Amt', 8)}`),
    ...dashedLine(),
  );

  for (const item of items) {
    const amt = `Rs.${(item.price * item.qty).toFixed(2)}`;
    bytes.push(...line(`${padRight(item.name, 18)} ${padRight(String(item.qty), 4)} ${padLeft(amt, 8)}`));
  }

  bytes.push(
    ...dashedLine(),
    ...line(`${padRight('Subtotal', 22)} ${padLeft('Rs.' + (subtotal||0).toFixed(2), 10)}`),
    ...line(`${padRight('CGST 2.5%', 22)} ${padLeft('Rs.' + (cgst||0).toFixed(2), 10)}`),
    ...line(`${padRight('SGST 2.5%', 22)} ${padLeft('Rs.' + (sgst||0).toFixed(2), 10)}`),
    ...BOLD_ON,
    ...line(`${padRight('TOTAL', 22)} ${padLeft('Rs.' + (total||0).toFixed(2), 10)}`),
    ...BOLD_OFF,
  );

  if (paymentMode) bytes.push(...line(`Payment: ${paymentMode.toUpperCase()}`));

  bytes.push(
    ...ALIGN_CENTER,
    ...line(''),
    ...line('Thank you, visit again!'),
    ...LF, ...LF, ...LF,
    ...CUT,
  );

  return new Uint8Array(bytes);
}

export async function smartPrintKOT(kotData) {
  if (window.electronAPI?.print) {
    const bytes = buildKOTBytes(kotData);
    const hasBarItems = kotData.items?.some(i => i.type === 'bar');
    const printerIp = localStorage.getItem(hasBarItems ? 'printer_BAR' : 'printer_KITCHEN');
    await window.electronAPI.print(bytes, printerIp);
    return;
  }
  printKOT(kotData);
}

export async function smartPrintBill(billData) {
  if (window.electronAPI?.print) {
    const bytes = buildBillBytes(billData);
    const printerIp = localStorage.getItem('printer_BILLING');
    await window.electronAPI.print(bytes, printerIp);
    return;
  }
  printBill(billData);
}

// Fallback popup print functions (kept exactly as they were)
export function printKOT(kotData) {
  const { kotNumber, table, section, captain, items, createdAt, restaurantName } = kotData;
  const timeStr = createdAt ? new Date(createdAt).toLocaleTimeString('en-IN') : new Date().toLocaleTimeString('en-IN');
  const w = window.open('', '_blank', 'width=320,height=600');
  if (!w) return;
  w.document.write(`
    <html><head><style>
      body{font-family:monospace;font-size:14px;margin:20px;}
      .center{text-align:center;}
      .bold{font-weight:bold;}
      .dashed{border-top:1px dashed #000;margin:8px 0;}
      .item{margin:4px 0;}
    </style></head><body>
      <div class="center bold">${restaurantName || 'Restaurant'}</div>
      <div class="center">KITCHEN ORDER TICKET</div>
      <div class="dashed"></div>
      <div class="bold">KOT #: ${kotNumber || '-'}</div>
      <div>Table: ${table || '-'} ${section || ''}</div>
      <div>Captain: ${captain || '-'}</div>
      <div class="dashed"></div>
      <div class="bold">Items:</div>
      ${items.map(i => `<div class="item">${i.qty || 1} x ${i.name}${i.note ? ` >> ${i.note}` : ''}</div>`).join('')}
      <div class="dashed"></div>
      <div>${timeStr}</div>
    </body></html>
  `);
  w.document.close();
  w.print();
}

export function printBill(billData) {
  const { billNumber, table, section, items, subtotal, cgst, sgst, total, paymentMode, restaurantName, restaurantAddress, gstin, createdAt } = billData;
  const timeStr = createdAt ? new Date(createdAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN');
  const w = window.open('', '_blank', 'width=320,height=600');
  if (!w) return;
  w.document.write(`
    <html><head><style>
      body{font-family:monospace;font-size:14px;margin:20px;}
      .center{text-align:center;}
      .bold{font-weight:bold;}
      .dashed{border-top:1px dashed #000;margin:8px 0;}
      .row{display:flex;justify-content:space-between;}
    </style></head><body>
      <div class="center bold" style="font-size:18px;">${restaurantName || 'Restaurant'}</div>
      ${restaurantAddress ? `<div class="center">${restaurantAddress}</div>` : ''}
      ${gstin ? `<div class="center">GSTIN: ${gstin}</div>` : ''}
      <div class="dashed"></div>
      <div>Bill #: ${billNumber || '-'}</div>
      <div>Table : ${table || '-'} ${section ? '(' + section + ')' : ''}</div>
      <div>Time  : ${timeStr}</div>
      <div class="dashed"></div>
      <div class="row"><span>Item</span><span>Qty</span><span>Amt</span></div>
      <div class="dashed"></div>
      ${items.map(i => `<div class="row"><span>${i.name}</span><span>${i.qty}</span><span>Rs.${(i.price * i.qty).toFixed(2)}</span></div>`).join('')}
      <div class="dashed"></div>
      <div class="row"><span>Subtotal</span><span>Rs.${(subtotal||0).toFixed(2)}</span></div>
      <div class="row"><span>CGST 2.5%</span><span>Rs.${(cgst||0).toFixed(2)}</span></div>
      <div class="row"><span>SGST 2.5%</span><span>Rs.${(sgst||0).toFixed(2)}</span></div>
      <div class="row bold"><span>TOTAL</span><span>Rs.${(total||0).toFixed(2)}</span></div>
      ${paymentMode ? `<div>Payment: ${paymentMode.toUpperCase()}</div>` : ''}
      <div class="dashed"></div>
      <div class="center">Thank you, visit again!</div>
    </body></html>
  `);
  w.document.close();
  w.print();
}
