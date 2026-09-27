const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Supplier = require('../models/Supplier');
const PurchaseRequest = require('../models/PurchaseRequest');
const Quotation = require('../models/Quotation');
const PurchaseOrder = require('../models/PurchaseOrder');
const GoodsReceipt = require('../models/GoodsReceipt');
const Payment = require('../models/Payment');
const { Counter } = require('../models/Counter');

dotenv.config({ path: __dirname + '/../../.env' });

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/purchase_management';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding...');

    // Drop database to remove legacy collection indexes
    await mongoose.connection.db.dropDatabase();
    console.log('Dropped existing database to reset indexes.');

    // 1. Create Demo Users (3 Roles Only)
    const demoPassword = 'password123';

    const employee = await User.create({
      name: 'Rohan Sharma (Employee)',
      email: 'employee@test.com',
      password: demoPassword,
      role: 'EMPLOYEE'
    });

    const manager = await User.create({
      name: 'Priya Verma (Manager)',
      email: 'manager@test.com',
      password: demoPassword,
      role: 'MANAGER'
    });

    const purchaseOfficer = await User.create({
      name: 'Anil Kumar (Purchase Officer)',
      email: 'purchase@test.com',
      password: demoPassword,
      role: 'PURCHASE_OFFICER'
    });

    console.log('3 Demo users created successfully:');
    console.log('- employee@test.com / password123 (Role: EMPLOYEE)');
    console.log('- manager@test.com  / password123 (Role: MANAGER)');
    console.log('- purchase@test.com / password123 (Role: PURCHASE_OFFICER)');

    // 2. Create Sample Suppliers
    const suppliers = await Supplier.create([
      {
        name: 'ABC Office Solutions',
        contactPerson: 'Rahul Patil',
        phone: '9876543210',
        email: 'abc@example.com',
        address: 'Pune, Maharashtra'
      },
      {
        name: 'XYZ Furniture',
        contactPerson: 'Pooja Sharma',
        phone: '9822012345',
        email: 'info@xyzfurniture.example.com',
        address: 'Mumbai, Maharashtra'
      },
      {
        name: 'TechSupply Systems',
        contactPerson: 'Vikram Joshi',
        phone: '9890122334',
        email: 'sales@techsupply.example.com',
        address: 'Bangalore, Karnataka'
      }
    ]);

    console.log('3 Suppliers created.');

    // 3. Create Sample Purchase Requests
    // PR-001: Approved PR
    const pr1 = await PurchaseRequest.create({
      requestNumber: 'PR-001',
      employee: employee._id,
      itemName: 'Office Chairs',
      description: 'Chairs for computer lab',
      quantity: 10,
      estimatedPrice: 50000,
      reason: 'New lab setup',
      requiredDate: new Date('2026-10-15'),
      status: 'APPROVED'
    });

    // PR-002: Pending PR (for Manager approval demo)
    const pr2 = await PurchaseRequest.create({
      requestNumber: 'PR-002',
      employee: employee._id,
      itemName: 'Monitors',
      description: '27-inch LED displays for lab',
      quantity: 5,
      estimatedPrice: 75000,
      reason: 'Graphics lab upgrade',
      requiredDate: new Date('2026-10-20'),
      status: 'PENDING'
    });

    // PR-003: Rejected PR
    const pr3 = await PurchaseRequest.create({
      requestNumber: 'PR-003',
      employee: employee._id,
      itemName: 'Keyboards & Mice',
      description: 'Standard USB keyboard and optical mouse sets',
      quantity: 20,
      estimatedPrice: 24000,
      reason: 'Room 102 hardware replacement',
      requiredDate: new Date('2026-10-25'),
      status: 'REJECTED',
      rejectionReason: 'Budget allocation deferred to next quarter'
    });

    console.log('3 Purchase Requests created (1 Approved, 1 Pending, 1 Rejected).');

    // 4. Create Quotations for PR-001
    const quote1 = await Quotation.create({
      quotationNumber: 'QT-001',
      purchaseRequest: pr1._id,
      supplier: suppliers[0]._id, // ABC Office Solutions
      itemName: 'Office Chairs',
      quantity: 10,
      quotedPrice: 46000,
      deliveryDate: new Date('2026-10-10'),
      remarks: 'Includes 3 years warranty and free delivery',
      status: 'SELECTED'
    });

    const quote2 = await Quotation.create({
      quotationNumber: 'QT-002',
      purchaseRequest: pr1._id,
      supplier: suppliers[1]._id, // XYZ Furniture
      itemName: 'Office Chairs',
      quantity: 10,
      quotedPrice: 48000,
      deliveryDate: new Date('2026-10-12'),
      remarks: 'Standard 1 year warranty',
      status: 'NOT SELECTED'
    });

    console.log('2 Quotations created for PR-001 (1 Selected, 1 Not Selected).');

    // 5. Initialize Counters
    await Counter.create([
      { id: 'PR', seq: 3 },
      { id: 'QT', seq: 2 },
      { id: 'PO', seq: 0 },
      { id: 'GR', seq: 0 },
      { id: 'PAY', seq: 0 }
    ]);

    console.log('Counters initialized.');
    console.log('=== Database Seeding Complete! Ready for placement interview demonstration. ===');
    process.exit(0);
  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
};

seedDatabase();
