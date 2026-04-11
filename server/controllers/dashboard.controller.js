import Customer from "../models/Customer.js";
import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";

export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 1) كل زبائن المستخدم
    const customers = await Customer.find({ createdBy: userId })
      .select("_id fullName")
      .lean();

    const customerIds = customers.map((c) => c._id);

    if (customerIds.length === 0) {
      return res.json({
        totalDebt: 0,
        customersInDebtCount: 0,
        archivedAccountsCount: 0,
        todayTransactionsCount: 0,
        latestTransactions: [],
        topDebtors: [],
      });
    }

    // 2) كل الحسابات المرتبطة بزبائن المستخدم
    const accounts = await Account.find({
      customer: { $in: customerIds },
    })
      .populate("customer", "fullName")
      .lean();

    const openAccounts = accounts.filter((acc) => acc.status === "open");
    const archivedAccountsCount = accounts.filter(
      (acc) => acc.status === "archived"
    ).length;

    const openAccountIds = openAccounts.map((acc) => acc._id);

    // 3) حركات اليوم
    const todayTransactionsCount = await Transaction.countDocuments({
      customer: { $in: customerIds },
      date: { $gte: todayStart, $lte: todayEnd },
    });

    // 4) آخر الحركات
    const latestTransactionsRaw = await Transaction.find({
      customer: { $in: customerIds },
    })
      .populate("customer", "fullName")
      .sort({ date: -1, createdAt: -1 })
      .limit(10)
      .lean();

    const latestTransactions = latestTransactionsRaw.map((tx) => ({
      _id: tx._id,
      customerId: tx.customer?._id || null,
      customerName: tx.customer?.fullName || "לקוח לא קיים",
      type: tx.type,
      amount: Number(tx.amount || 0),
      description: tx.description || "",
      date: tx.date,
    }));

    // 5) حساب الرصيد لكل حساب مفتوح
    const balancesAgg =
      openAccountIds.length > 0
        ? await Transaction.aggregate([
            {
              $match: {
                account: { $in: openAccountIds },
              },
            },
            {
              $group: {
                _id: "$account",
                debtTotal: {
                  $sum: {
                    $cond: [{ $eq: ["$type", "debt"] }, "$amount", 0],
                  },
                },
                paymentTotal: {
                  $sum: {
                    $cond: [{ $eq: ["$type", "payment"] }, "$amount", 0],
                  },
                },
                returnTotal: {
                  $sum: {
                    $cond: [{ $eq: ["$type", "return"] }, "$amount", 0],
                  },
                },
              },
            },
          ])
        : [];

    const balanceMap = new Map();

    for (const row of balancesAgg) {
      const balance =
        Number(row.debtTotal || 0) -
        Number(row.paymentTotal || 0) -
        Number(row.returnTotal || 0);

      balanceMap.set(String(row._id), balance);
    }

    const openAccountsWithBalance = openAccounts.map((acc) => ({
      _id: acc._id,
      customerId: acc.customer?._id || null,
      customerName: acc.customer?.fullName || "לקוח לא קיים",
      balance: Number(balanceMap.get(String(acc._id)) || 0),
    }));

    const debtAccounts = openAccountsWithBalance.filter((acc) => acc.balance > 0);

    const totalDebt = debtAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    const customersInDebtCount = debtAccounts.length;

    const topDebtors = debtAccounts
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 5)
      .map((acc) => ({
        _id: acc._id,
        customerId: acc.customerId,
        name: acc.customerName,
        balance: acc.balance,
      }));

    return res.json({
      totalDebt,
      customersInDebtCount,
      archivedAccountsCount,
      todayTransactionsCount,
      latestTransactions,
      topDebtors,
    });
  } catch (error) {
    console.error("getDashboardStats error:", error);
    return res.status(500).json({
      message: "Failed to load dashboard stats",
    });
  }
};