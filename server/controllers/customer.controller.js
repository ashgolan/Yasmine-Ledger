import Customer from "../models/Customer.js";
import Transaction from "../models/Transaction.js";
import Account from "../models/Account.js";
import Quote from "../models/Quote.js";
import DeliveryNote from "../models/DeliveryNote.js";
import mongoose from "mongoose";

export const getCustomers = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const customers = await Customer.find({ createdBy: userId, isActive: true })
      .sort({ fullName: 1 })
      .lean();

    if (!customers.length) return res.json([]);

    const customerIds = customers.map((c) => c._id);

    const balances = await Transaction.aggregate([
      { $match: { createdBy: userId, customer: { $in: customerIds } } },
      {
        $group: {
          _id: "$customer",
          balance: {
            $sum: {
              $switch: {
                branches: [
                  { case: { $eq: ["$type", "debt"] },    then: "$amount" },
                  { case: { $eq: ["$type", "payment"] }, then: { $multiply: ["$amount", -1] } },
                  { case: { $eq: ["$type", "return"] },  then: { $multiply: ["$amount", -1] } },
                ],
                default: 0,
              },
            },
          },
        },
      },
    ]);

    const openAccounts = await Account.find({
      customer: { $in: customerIds },
      status: "open",
      createdBy: userId,
    }).select("customer openedAt").lean();

    const balanceMap  = new Map(balances.map((b) => [String(b._id), b.balance || 0]));
    const openedAtMap = new Map(openAccounts.map((a) => [String(a.customer), a.openedAt]));

    const result = customers.map((customer) => ({
      ...customer,
      balance:  balanceMap.get(String(customer._id)) || 0,
      openedAt: openedAtMap.get(String(customer._id)) || null,
    }));

    res.json(result);
  } catch (err) {
    console.error("getCustomers error:", err);
    res.status(500).json({ message: "שגיאה בטעינת לקוחות" });
  }
};

export const createCustomer = async (req, res) => {
  try {
    const fullName  = req.body.fullName?.trim();
    const phone     = req.body.phone?.trim()    || "";
    const idNumber  = req.body.idNumber?.trim() || "";  // ← ADDED

    if (!fullName) {
      return res.status(400).json({ message: "יש להזין שם לקוח" });
    }

    const customer = await Customer.create({
      fullName,
      phone,
      idNumber,  // ← ADDED
      createdBy: req.user._id,
    });

    await Account.create({
      customer:  customer._id,
      status:    "open",
      createdBy: req.user._id,
    });

    res.status(201).json(customer);
  } catch (err) {
    console.error("createCustomer error:", err);
    res.status(500).json({ message: "שגיאה ביצירת לקוח" });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const { id }   = req.params;
    const fullName = req.body.fullName?.trim();
    const phone    = req.body.phone?.trim()    ?? "";
    const idNumber = req.body.idNumber?.trim() ?? "";  // ← ADDED

    if (!fullName) {
      return res.status(400).json({ message: "יש להזין שם לקוח" });
    }

    const customer = await Customer.findOneAndUpdate(
      { _id: id, createdBy: req.user._id },
      { fullName, phone, idNumber },  // ← ADDED
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({ message: "לקוח לא נמצא" });
    }

    res.json(customer);
  } catch (err) {
    console.error("updateCustomer error:", err);
    res.status(500).json({ message: "שגיאה בעדכון פרטי הלקוח" });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const { id }  = req.params;
    const userId  = req.user._id;

    const customer = await Customer.findOne({ _id: id, createdBy: userId });
    if (!customer) {
      return res.status(404).json({ message: "לקוח לא נמצא" });
    }

    const customerId = customer._id;

    await Transaction.deleteMany({ customer: customerId, createdBy: userId });
    await Account.deleteMany({ customer: customerId, createdBy: userId });
    await Quote.deleteMany({ customer: customerId, createdBy: userId });
    await DeliveryNote.deleteMany({ customer: customerId, createdBy: userId });
    await Customer.deleteOne({ _id: customerId });

    res.json({ message: "הלקוח נמחק בהצלחה" });
  } catch (err) {
    console.error("deleteCustomer error:", err);
    res.status(500).json({ message: "שגיאה במחיקת הלקוח" });
  }
};
