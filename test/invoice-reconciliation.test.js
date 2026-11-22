'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');
const reports = require('../lib/reports');

function makeOrder(items, coupon) {
  const totals = pricing.computeTotals(items, coupon || '');
  return {
    id: 1,
    date: '01/01/2022',
    customer: 'In-memory customer',
    paymentMode: 'cash',
    status: 'completed',
    items: items,
    coupon: coupon || '',
    subtotal: totals.subtotal,
    discount: totals.discount,
    tax: totals.tax,
    total: totals.total
  };
}

test('CURRENT BEHAVIOUR: ledger pricing applies SAVE10 to subtotal before HSN GST', function () {
  const order = makeOrder([
    { id: 1, sku: 'RICE-1', name: 'Rice', hsn: '1006', price: 640, qty: 1 }
  ], 'SAVE10');
  const totals = pricing.computeTotals(order.items, order.coupon);

  assert.equal(totals.subtotal, 640);
  assert.equal(totals.discount, 64);
  assert.equal(totals.tax, 28.8);
  assert.equal(totals.total, 604.8);
  assert.equal(totals.lines[0].gstPercent, 5);
});

test('Invoice reproduces the billed GST breakdown and total', function () {
  const order = makeOrder([
    { id: 6, sku: 'RICE-4', name: 'Rice', hsn: '1006', price: 640, qty: 1 }
  ], 'SAVE10');
  const figures = invoice.computeInvoiceFigures(order);

  assert.equal(figures.subtotal, order.subtotal);
  assert.equal(figures.discount, order.discount);
  assert.equal(figures.tax, order.tax);
  assert.equal(figures.cgst, 14.4);
  assert.equal(figures.sgst, 14.4);
  assert.equal(figures.total, order.total);
  assert.equal(figures.rows[0].gstPercent, 5);
  assert.equal(figures.rows[0].lineTax, 28.8);
});

test('Invoice uses the same capped coupon discount and tax as the billed order', function () {
  const order = makeOrder([
    { id: 2, sku: 'TEA-1', name: 'Tea', hsn: '0902', price: 2000, qty: 1 }
  ], 'SAVE10');
  const figures = invoice.computeInvoiceFigures(order);

  assert.equal(order.discount, 150);
  assert.equal(order.tax, 333);
  assert.equal(order.total, 2183);
  assert.equal(figures.discount, order.discount);
  assert.equal(figures.tax, order.tax);
  assert.equal(figures.total, order.total);
  assert.equal(figures.rows[0].lineTax, 333);
});

test('Invoice does not apply a configured inactive coupon excluded from the billed order', function () {
  const order = makeOrder([
    { id: 3, sku: 'COFFEE-1', name: 'Coffee', hsn: '0901', price: 1000, qty: 1 }
  ], 'DIWALI20');
  const figures = invoice.computeInvoiceFigures(order);

  assert.equal(order.discount, 0);
  assert.equal(order.total, 1180);
  assert.equal(figures.discount, order.discount);
  assert.equal(figures.total, order.total);
});

test('Reconciliation matches the invoice to billed figures and excludes cancelled orders', function () {
  const activeOrder = makeOrder([
    { id: 4, sku: 'RICE-2', name: 'Rice', hsn: '1006', price: 640, qty: 1 }
  ], 'SAVE10');
  const cancelledOrder = Object.assign({}, activeOrder, { id: 2, status: 'cancelled' });
  const result = reports.getGstReconciliation({
    orders: [activeOrder, cancelledOrder],
    customers: [],
    products: []
  });

  assert.equal(result.totalChecked, 1);
  assert.equal(result.mismatchCount, 0);
  assert.equal(result.totalDelta, 0);
  assert.equal(result.rows[0].orderId, activeOrder.id);
  assert.equal(result.rows[0].ledgerTax, 28.8);
  assert.equal(result.rows[0].invoiceTax, 28.8);
  assert.equal(result.rows[0].ledgerTotal, 604.8);
  assert.equal(result.rows[0].invoiceTotal, 604.8);
  assert.equal(result.rows[0].matched, true);
});

test('Rendered invoice omits the mismatch notice when billed figures match', function () {
  const order = makeOrder([
    { id: 5, sku: 'RICE-3', name: 'Rice', hsn: '1006', price: 640, qty: 1 }
  ], 'SAVE10');
  const html = invoice.render(order);

  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
  assert.match(html, /Invoice Total/);
  assert.match(html, /604\.80/);
});
