import Customer from "../models/customer.model.js";
import Measurement from "../models/measurement.model.js";
import Counter from "../models/counter.model.js";

// PATH     : /api/customer/all
// METHOD   : GET
// ACCESS   : PRIVATE
// DESC     : Get all Customers
export const getAllCustomers = async (req, res) => {
  try {
    const customer = await Customer.find()
      .populate("measurement")
      .sort({ createdAt: -1 });

    if (!customer.length === 0) return res.status(200).json([]);
    return res.status(200).json(customer);
  } catch (error) {
    console.log("Error in getAllCustomers Controller:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

// PATH     : /api/customer/id"
// METHOD   : GET
// ACCESS   : Public
// DESC     : Get Customer by Id
export const getCustomer = async (req, res) => {
  const { id } = req.params;
  try {
    const customer = await Customer.findById(id).populate("measurement");
    res.status(200).json(customer);
  } catch (error) {
    console.log("Error in getCustomer Controller", error.message);
    res.status(500).json({ error: error.message });
  }
};

// PATH     : /api/customer/add
// METHOD   : POST
// ACCESS   : PRIVATE
// DESC     : Add new Customer
export const addCustomer = async (req, res) => {
  try {
    const { name, phone } = req.body;

    const existing = await Customer.findOne({ phone });
    if (existing)
      return res.status(400).json({ message: "Phone number already exists" });

    let counter = await Counter.findOne({ name: "customer" });

    if (!counter) {
      counter = await Counter.create({ name: "customer", value: 1 });
    }

    // Assign and increment the ID
    const newId = String(counter.value).padStart(2, "0");
    counter.value += 1;
    await counter.save();

    const newCustomer = new Customer({
      name,
      phone,
      customerId: newId,
    });

    const customer = await newCustomer.save();
    res.status(201).json(customer);
  } catch (error) {
    console.error("Error in addCustomer controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// PATH     : /api/customer/update/:id
// METHOD   : PUT
// ACCESS   : PRIVATE
// DESC     : update customer
export const updateCustomer = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const { id } = req.params;

    const customer = await Customer.findById(id);
    if (!customer)
      return res.status(404).json({ message: "Customer not found" });

    if (name) customer.name = name;
    if (phone) customer.phone = phone;

    const updated = await customer.save();
    res.status(200).json(updated);
  } catch (error) {
    console.error("Error in updateCustomer controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// PATH     : /api/customer/:id"
// METHOD   : DELETE
// ACCESS   : PRIVATE
// DESC     : Delete Customer
export const deleteCustomer = async (req, res) => {
  const { id } = req.params;

  try {
    const customer = await Customer.findById(id);
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    // Delete associated measurement if exists
    await Measurement.deleteOne({ customer: id });

    // Delete the customer
    await Customer.findByIdAndDelete(id);

    res.status(200).json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error("Error in deleteCustomer controller:", error.message);
    res.status(500).json({ error: error.message });
  }
};
