import Customer from "../models/Customer.js";
import Account from "../models/Account.js";
import Transaction from "../models/transaction.model.js";
import mongoose from "mongoose";

// ➕ إضافة زبون + إنشاء حساب تلقائي
export const createCustomer = async (req, res) => {
  const { fullName, phone, note } = req.body;

  if (!fullName?.trim()) {
    return res.status(400).json({
      message: "יש להזין שם לקוח.",
    });
  }

  const customer = await Customer.create({
    fullName: fullName.trim(),
    phone: phone || "",
    note: note || "",
    createdBy: req.user._id,
  });

  // إنشاء حساب مفتوح تلقائي
  await Account.create({
    customer: customer._id,
    createdBy: req.user._id,
  });

  return res.status(201).json({
    message: "הלקוח נוצר בהצלחה.",
    customer,
  });
};

// 📥 جلب كل الزبائن

export const getCustomers = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    // 1) كل الزبائن التابعين للمستخدم
    const customers = await Customer.find({
      createdBy: userId,
      isActive: true,
    })
      .sort({ fullName: 1 })
      .lean();

    // إذا لا يوجد زبائن نرجع مصفوفة فارغة مباشرة
    if (!customers.length) {
      return res.json([]);
    }

    // 2) حساب الرصيد لكل زبون من الحركات
    const balances = await Transaction.aggregate([
      {
        $match: {
          createdBy: userId,
          customer: {
            $in: customers.map((c) => c._id),
          },
        },
      },
      {
        $group: {
          _id: "$customer",
          balance: {
            $sum: {
              $switch: {
                branches: [
                  {
                    case: { $eq: ["$type", "debt"] },
                    then: "$amount",
                  },
                  {
                    case: { $eq: ["$type", "payment"] },
                    then: { $multiply: ["$amount", -1] },
                  },
                  {
                    case: { $eq: ["$type", "return"] },
                    then: { $multiply: ["$amount", -1] },
                  },
                ],
                default: 0,
              },
            },
          },
        },
      },
    ]);

    // 3) تحويل نتائج aggregation إلى map سريع
    const balanceMap = new Map(
      balances.map((item) => [String(item._id), item.balance || 0])
    );

    // 4) دمج الرصيد داخل كل زبون
    const result = customers.map((customer) => ({
      ...customer,
      balance: balanceMap.get(String(customer._id)) || 0,
    }));

    res.json(result);
  } catch (err) {
    console.error("getCustomers error:", err);
    res.status(500).json({
      message: "שגיאה בטעינת לקוחות",
    });
  }
};