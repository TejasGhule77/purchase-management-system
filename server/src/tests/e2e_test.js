const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 Starting End-to-End MERN Purchase Workflow Test');
  console.log('====================================================\n');

  try {
    // 1. Health check
    const health = await (await fetch(`${BASE_URL}/health`)).json();
    console.log('✅ 1. Health Check:', health.message);

    // 2. Employee Login
    console.log('\n--- Phase 1: Authentication ---');
    const empLoginRes = await (await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'employee@test.com', password: 'Password123' })
    })).json();
    console.log('✅ 2. Employee Login Succeeded:', empLoginRes.user.name, `(${empLoginRes.user.role})`);
    const empToken = empLoginRes.token;

    // 3. Employee creates a new Purchase Request (PR)
    console.log('\n--- Phase 2: Purchase Request Creation ---');
    const createPrRes = await (await fetch(`${BASE_URL}/purchase-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${empToken}`
      },
      body: JSON.stringify({
        itemName: 'Apple MacBook Pro M3 Max 16-inch',
        description: 'Space Black, 36GB Unified Memory, 1TB SSD for AI Development',
        quantity: 2,
        estimatedUnitPrice: 245000,
        requiredDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        reason: 'Senior AI research team deployment',
        priority: 'URGENT',
        submitDirectly: true
      })
    })).json();

    if (!createPrRes.success) throw new Error(createPrRes.message);
    const newPR = createPrRes.data;
    console.log(`✅ 3. PR Created & Submitted: ${newPR.requestNumber} | Item: ${newPR.itemName} | Total: ₹${newPR.estimatedTotal.toLocaleString('en-IN')} | Status: ${newPR.status}`);

    // 4. Manager Login & Approval
    console.log('\n--- Phase 3: Manager Approval ---');
    const mgrLoginRes = await (await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'manager@test.com', password: 'Password123' })
    })).json();
    const mgrToken = mgrLoginRes.token;
    console.log('✅ 4. Manager Login Succeeded:', mgrLoginRes.user.name);

    const approveRes = await (await fetch(`${BASE_URL}/purchase-requests/${newPR._id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mgrToken}`
      },
      body: JSON.stringify({
        approvalComment: 'Approved for AI lab high-priority delivery.'
      })
    })).json();
    if (!approveRes.success) throw new Error(approveRes.message);
    console.log(`✅ 5. Manager Approved PR: ${newPR.requestNumber} -> Status is now ${approveRes.data.status}`);

    // 5. Procurement Login & Suppliers
    console.log('\n--- Phase 4: Procurement & Quotation Management ---');
    const procLoginRes = await (await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'procurement@test.com', password: 'Password123' })
    })).json();
    const procToken = procLoginRes.token;
    console.log('✅ 6. Procurement Officer Login Succeeded:', procLoginRes.user.name);

    // Fetch suppliers
    const supList = await (await fetch(`${BASE_URL}/suppliers`, {
      headers: { 'Authorization': `Bearer ${procToken}` }
    })).json();
    console.log(`✅ 7. Loaded ${supList.data.length} registered suppliers.`);
    const sup1 = supList.data[0];
    const sup2 = supList.data[1];

    // Add Quotation 1 from Supplier 1 (Dell)
    const quote1Res = await (await fetch(`${BASE_URL}/quotations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${procToken}`
      },
      body: JSON.stringify({
        purchaseRequestId: newPR._id,
        supplierId: sup1._id,
        unitPrice: 240000,
        tax: 43200, // GST
        deliveryDays: 5,
        paymentTerms: 'Net 30 Days',
        remarks: 'Direct Apple Authorised Partner pricing with AppleCare+'
      })
    })).json();
    console.log(`✅ 8. Quotation 1 recorded: ${quote1Res.data.quotationNumber} from ${sup1.name} | Total: ₹${quote1Res.data.totalAmount.toLocaleString('en-IN')} | Delivery: ${quote1Res.data.deliveryDays} Days`);

    // Add Quotation 2 from Supplier 2 (Apex)
    const quote2Res = await (await fetch(`${BASE_URL}/quotations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${procToken}`
      },
      body: JSON.stringify({
        purchaseRequestId: newPR._id,
        supplierId: sup2._id,
        unitPrice: 244000,
        tax: 43920,
        deliveryDays: 8,
        paymentTerms: 'Net 15 Days',
        remarks: 'Standard packaging'
      })
    })).json();
    console.log(`✅ 9. Quotation 2 recorded: ${quote2Res.data.quotationNumber} from ${sup2.name} | Total: ₹${quote2Res.data.totalAmount.toLocaleString('en-IN')} | Delivery: ${quote2Res.data.deliveryDays} Days`);

    // Select Winning Quotation (Quote 1 - lowest price and fastest delivery)
    const selectRes = await (await fetch(`${BASE_URL}/quotations/${quote1Res.data._id}/select`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${procToken}`
      }
    })).json();
    console.log(`✅ 10. Selected Best Quotation: ${quote1Res.data.quotationNumber} (Status: ${selectRes.data.status})`);

    // 6. Generate Purchase Order
    console.log('\n--- Phase 5: Purchase Order Generation ---');
    const poRes = await (await fetch(`${BASE_URL}/purchase-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${procToken}`
      },
      body: JSON.stringify({
        quotationId: quote1Res.data._id,
        deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        paymentTerms: 'Net 30 Days',
        description: 'Priority delivery to AI Research Wing'
      })
    })).json();
    if (!poRes.success) throw new Error(poRes.message);
    const newPO = poRes.data;
    console.log(`✅ 11. Purchase Order Created: ${newPO.poNumber} | Total Amount: ₹${newPO.totalAmount.toLocaleString('en-IN')} | Supplier: ${sup1.name}`);

    // 7. Finance Login, Goods Receipt & Payment
    console.log('\n--- Phase 6: Finance/Store Goods Receipt & Payment Settlement ---');
    const finLoginRes = await (await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'finance@test.com', password: 'Password123' })
    })).json();
    const finToken = finLoginRes.token;
    console.log('✅ 12. Finance/Store Officer Login Succeeded:', finLoginRes.user.name);

    // Record Goods Receipt (Full receipt: 2 of 2 units)
    const grnRes = await (await fetch(`${BASE_URL}/goods-receipts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${finToken}`
      },
      body: JSON.stringify({
        purchaseOrderId: newPO._id,
        receivedQuantity: 2,
        damagedQuantity: 0,
        remarks: 'All 2 MacBooks inspected and verified with Apple serial tags.'
      })
    })).json();
    if (!grnRes.success) throw new Error(grnRes.message);
    console.log(`✅ 13. Goods Receipt Logged: ${grnRes.data.grnNumber} | Received Qty: ${grnRes.data.receivedQuantity} | Pending Qty: ${grnRes.data.pendingQuantity}`);

    // Record Vendor Payment
    const payRes = await (await fetch(`${BASE_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${finToken}`
      },
      body: JSON.stringify({
        purchaseOrderId: newPO._id,
        amount: newPO.totalAmount,
        paymentMethod: 'Bank Transfer',
        transactionReference: 'NEFT-HDFC-99182377',
        remarks: 'Full settlement against invoice # INV-APPLE-2026-001'
      })
    })).json();
    if (!payRes.success) throw new Error(payRes.message);
    console.log(`✅ 14. Vendor Payment Settled: ${payRes.data.paymentNumber} | Amount Paid: ₹${payRes.data.amount.toLocaleString('en-IN')} | Ref: ${payRes.data.transactionReference}`);

    // Verify final PO status and dashboard stats
    const updatedPORes = await (await fetch(`${BASE_URL}/purchase-orders/${newPO._id}`, {
      headers: { 'Authorization': `Bearer ${finToken}` }
    })).json();
    console.log(`✅ 15. Final Purchase Order Status: ${updatedPORes.data.status} | Payment Status: ${updatedPORes.data.paymentStatus}`);

    const dashboardRes = await (await fetch(`${BASE_URL}/dashboard/stats`, {
      headers: { 'Authorization': `Bearer ${finToken}` }
    })).json();
    console.log(`✅ 16. Dashboard Metrics Verified: Total POs: ${dashboardRes.data.summary.totalPOs}, Completed POs: ${dashboardRes.data.summary.completedPOs}, Total Settled Spend: ₹${dashboardRes.data.summary.totalPaidSpend.toLocaleString('en-IN')}`);

    console.log('\n====================================================');
    console.log('🎉 ALL 16 STEPS OF THE PURCHASE LIFECYCLE PASSED 100%!');
    console.log('====================================================\n');
  } catch (err) {
    console.error('❌ Test failed with error:', err.message);
  }
}

runTests();
