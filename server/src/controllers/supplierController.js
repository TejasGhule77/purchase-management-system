const Supplier = require('../models/Supplier');

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private
exports.getSuppliers = async (req, res, next) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }

    const suppliers = await Supplier.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: suppliers.length,
      data: suppliers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single supplier
// @route   GET /api/suppliers/:id
// @access  Private
exports.getSupplierById = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    res.status(200).json({
      success: true,
      data: supplier
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create supplier
// @route   POST /api/suppliers
// @access  Private (Purchase Officer)
exports.createSupplier = async (req, res, next) => {
  try {
    const { name, contactPerson, email, phone, address } = req.body;

    if (!name || !contactPerson || !email || !phone || !address) {
      return res.status(400).json({ success: false, message: 'Please provide all supplier details: Name, Contact Person, Phone, Email, Address' });
    }

    const existing = await Supplier.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Supplier with this email already exists' });
    }

    const supplier = await Supplier.create({
      name,
      contactPerson,
      email: email.toLowerCase(),
      phone,
      address
    });

    res.status(201).json({
      success: true,
      data: supplier,
      message: 'Supplier added successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private (Purchase Officer)
exports.updateSupplier = async (req, res, next) => {
  try {
    const { name, contactPerson, email, phone, address } = req.body;

    let supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    if (email && email.toLowerCase() !== supplier.email) {
      const emailExists = await Supplier.findOne({ email: email.toLowerCase(), _id: { $ne: req.params.id } });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Another supplier is using this email' });
      }
      supplier.email = email.toLowerCase();
    }

    if (name) supplier.name = name;
    if (contactPerson) supplier.contactPerson = contactPerson;
    if (phone) supplier.phone = phone;
    if (address) supplier.address = address;

    await supplier.save();

    res.status(200).json({
      success: true,
      data: supplier,
      message: 'Supplier updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Private (Purchase Officer)
exports.deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    await Supplier.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Supplier deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
