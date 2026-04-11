import Customer from "../models/Customer.js";
import Transaction from "../models/Transaction.js";

export const globalSearch = async (req, res) => {
  try {
    const userId = req.user._id;
    const q = String(req.query.q || "").trim();

    if (!q) {
      return res.json({
        customers: [],
        transactions: [],
      });
    }

    const customers = await Customer.find({
      createdBy: userId,
      $or: [
        { fullName: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
        { note: { $regex: q, $options: "i" } },
      ],
    })
      .select("_id fullName phone")
      .sort({ fullName: 1 })
      .limit(8)
      .lean();

    const customerIds = customers.map((c) => c._id);

    const transactions = await Transaction.find({
      $or: [
        { customer: { $in: customerIds.length ? customerIds : [null] } },
        { description: { $regex: q, $options: "i" } },
        { note: { $regex: q, $options: "i" } },
      ],
    })
      .populate("customer", "fullName")
      .sort({ date: -1, createdAt: -1 })
      .limit(8)
      .lean();

    const mappedTransactions = transactions.map((tx) => ({
      _id: tx._id,
      customerId: tx.customer?._id || null,
      customerName: tx.customer?.fullName || "לקוח לא קיים",
      type: tx.type,
      amount: Number(tx.amount || 0),
      description: tx.description || "",
      date: tx.date,
    }));

    return res.json({
      customers,
      transactions: mappedTransactions,
    });
  } catch (error) {
    console.error("globalSearch error:", error);
    return res.status(500).json({
      message: "Failed to search",
    });
  }
};