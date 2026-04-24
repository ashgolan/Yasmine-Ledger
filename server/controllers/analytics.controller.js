import Transaction from "../models/Transaction.js";
import Customer from "../models/Customer.js";
import Account from "../models/Account.js";
import Item from "../models/Item.js";
import Quote from "../models/Quote.js";
import DeliveryNote from "../models/DeliveryNote.js";

// ─── Helper: حساب بداية ونهاية فترة ───────────────────────────────────────
function getPeriodRange(period) {
  const now = new Date();
  const from = new Date();
  if (period === "week") {
    from.setDate(now.getDate() - 6);
  } else if (period === "month") {
    from.setDate(now.getDate() - 29);
  } else if (period === "year") {
    from.setFullYear(now.getFullYear() - 1);
  } else {
    // day
    from.setHours(0, 0, 0, 0);
  }
  from.setHours(0, 0, 0, 0);
  return { from, to: now };
}

// ─── GET /analytics/overview ──────────────────────────────────────────────
// period: day | week | month | year
export const getAnalyticsOverview = async (req, res) => {
  try {
    const userId = req.user._id;
    const period = req.query.period || "month";
    const { from, to } = getPeriodRange(period);

    // ── جلب كل الزبائن ──
    const customers = await Customer.find({ createdBy: userId })
      .select("_id")
      .lean();
    const customerIds = customers.map((c) => c._id);

    if (customerIds.length === 0) {
      return res.json(emptyResponse());
    }

    // ── جلب كل الحسابات ──
    const accounts = await Account.find({
      customer: { $in: customerIds },
    }).lean();

    const openAccounts = accounts.filter((a) => a.status === "open");
    const openAccountIds = openAccounts.map((a) => a._id);

    // ── 1) KPIs: رصيد إجمالي ──
    const balancesAgg = openAccountIds.length > 0
      ? await Transaction.aggregate([
          { $match: { account: { $in: openAccountIds } } },
          {
            $group: {
              _id: "$account",
              debtTotal: { $sum: { $cond: [{ $eq: ["$type", "debt"] }, "$amount", 0] } },
              paymentTotal: { $sum: { $cond: [{ $eq: ["$type", "payment"] }, "$amount", 0] } },
              returnTotal: { $sum: { $cond: [{ $eq: ["$type", "return"] }, "$amount", 0] } },
            },
          },
        ])
      : [];

    let totalDebt = 0;
    let totalPaid = 0;
    let customersInDebt = 0;

    for (const row of balancesAgg) {
      const balance = Number(row.debtTotal) - Number(row.paymentTotal) - Number(row.returnTotal);
      if (balance > 0) {
        totalDebt += balance;
        customersInDebt++;
      }
      totalPaid += Number(row.paymentTotal) + Number(row.returnTotal);
    }

    // ── 2) عسقات الفترة ──
    const periodTransactions = await Transaction.find({
      customer: { $in: customerIds },
      date: { $gte: from, $lte: to },
    })
      .populate("item", "name category")
      .lean();

    const periodDebts = periodTransactions
      .filter((t) => t.type === "debt")
      .reduce((s, t) => s + Number(t.amount || 0), 0);

    const periodPayments = periodTransactions
      .filter((t) => t.type === "payment")
      .reduce((s, t) => s + Number(t.amount || 0), 0);

    const periodReturns = periodTransactions
      .filter((t) => t.type === "return")
      .reduce((s, t) => s + Number(t.amount || 0), 0);

    // ── 3) رسم بياني شهري (آخر 6 أشهر) ──
    const monthlyAgg = await Transaction.aggregate([
      {
        $match: {
          customer: { $in: customerIds },
          date: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 5, 1)),
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            type: "$type",
          },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // بناء بيانات الرسم البياني لآخر 6 أشهر
    const monthlyChart = buildMonthlyChart(monthlyAgg);

    // ── 4) أكثر الفئات مبيعاً ──
    const debtTxWithItems = await Transaction.find({
      customer: { $in: customerIds },
      type: "debt",
      item: { $ne: null },
      date: { $gte: from, $lte: to },
    })
      .populate("item", "name category")
      .lean();

    const categoryMap = {};
    const itemMap = {};

    for (const tx of debtTxWithItems) {
      if (!tx.item) continue;
      const cat = tx.item.category || "ללא קטגוריה";
      const itemName = tx.item.name;
      const amt = Number(tx.amount || 0);

      categoryMap[cat] = (categoryMap[cat] || 0) + amt;
      itemMap[itemName] = (itemMap[itemName] || 0) + amt;
    }

    // أيضاً حساب من description لمن لم يستخدم item
    const debtTxNoItems = periodTransactions.filter(
      (t) => t.type === "debt" && !t.item && t.description
    );
    for (const tx of debtTxNoItems) {
      const desc = tx.description.trim();
      if (desc) {
        itemMap[desc] = (itemMap[desc] || 0) + Number(tx.amount || 0);
      }
    }

    const topCategories = Object.entries(categoryMap)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);

    const topItems = Object.entries(itemMap)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    // ── 5) פעילות לפי יום בשבוע ──
    // $dayOfWeek ב-MongoDB עובד ב-UTC בלבד
    // ישראל = UTC+2 חורף / UTC+3 קיץ — חייבים timezone
    const weekdayAgg = await Transaction.aggregate([
      {
        $match: {
          customer: { $in: customerIds },
          date: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: {
            $dayOfWeek: {
              date: "$date",
              timezone: "Asia/Jerusalem",
            },
          },
          count: { $sum: 1 },
          total: { $sum: "$amount" },
        },
      },
    ]);

    // 1=ראשון(א), 2=שני(ב), ... 7=שבת(ש)
    const hebrewDays = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];
    const weekdayData = Array.from({ length: 7 }, (_, i) => {
      const mongoDay = i + 1;
      const found = weekdayAgg.find((d) => d._id === mongoDay);
      return {
        label: hebrewDays[i],
        count: found ? found.count : 0,
        total: found ? Number(found.total) : 0,
      };
    });

    // ── 6) أكبر المدينين حالياً ──
    const accountCustomerMap = {};
    for (const acc of openAccounts) {
      accountCustomerMap[String(acc._id)] = acc.customer;
    }

    const topDebtorsAgg = await Transaction.aggregate([
      { $match: { account: { $in: openAccountIds } } },
      {
        $group: {
          _id: "$account",
          debtTotal: { $sum: { $cond: [{ $eq: ["$type", "debt"] }, "$amount", 0] } },
          paymentTotal: { $sum: { $cond: [{ $eq: ["$type", "payment"] }, "$amount", 0] } },
          returnTotal: { $sum: { $cond: [{ $eq: ["$type", "return"] }, "$amount", 0] } },
        },
      },
    ]);

    const debtorsWithBalance = topDebtorsAgg
      .map((row) => ({
        accountId: row._id,
        customerId: accountCustomerMap[String(row._id)],
        balance: Number(row.debtTotal) - Number(row.paymentTotal) - Number(row.returnTotal),
      }))
      .filter((d) => d.balance > 0)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 5);

    const topDebtorCustomerIds = debtorsWithBalance.map((d) => d.customerId);
    const debtorCustomers = await Customer.find({
      _id: { $in: topDebtorCustomerIds },
    })
      .select("_id fullName phone")
      .lean();

    const customerLookup = {};
    for (const c of debtorCustomers) {
      customerLookup[String(c._id)] = c;
    }

    const topDebtors = debtorsWithBalance.map((d) => {
      const cust = customerLookup[String(d.customerId)] || {};
      return {
        customerId: d.customerId,
        name: cust.fullName || "לקוח",
        phone: cust.phone || "",
        balance: d.balance,
      };
    });

    // ── 7) معدل تحويل הצעות מחיר ──
    const [totalQuotes, convertedQuotes] = await Promise.all([
      Quote.countDocuments({ createdBy: userId }),
      Quote.countDocuments({ createdBy: userId, status: "converted" }),
    ]);

    const quoteConversionRate = totalQuotes > 0
      ? Math.round((convertedQuotes / totalQuotes) * 100)
      : 0;

    // ── 8) معدل تحويل תעודות משלוח ──
    const [totalNotes, convertedNotes] = await Promise.all([
      DeliveryNote.countDocuments({ createdBy: userId }),
      DeliveryNote.countDocuments({ createdBy: userId, status: "converted" }),
    ]);

    const noteConversionRate = totalNotes > 0
      ? Math.round((convertedNotes / totalNotes) * 100)
      : 0;

    // ── 9) مقارنة الفترة السابقة ──
    const prevFrom = new Date(from);
    const prevTo = new Date(from);
    const diff = to - from;
    prevFrom.setTime(prevFrom.getTime() - diff);
    prevTo.setTime(prevTo.getTime() - 1);

    const prevDebtsAgg = await Transaction.aggregate([
      {
        $match: {
          customer: { $in: customerIds },
          type: "debt",
          date: { $gte: prevFrom, $lte: prevTo },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const prevDebts = prevDebtsAgg[0]?.total || 0;
    const debtChange = prevDebts > 0
      ? Math.round(((periodDebts - prevDebts) / prevDebts) * 100)
      : null;

    return res.json({
      kpis: {
        totalDebt,
        totalPaid,
        customersInDebt,
        customersCount: customers.length,
        periodDebts,
        periodPayments,
        periodReturns,
        debtChange,
        totalQuotes,
        convertedQuotes,
        quoteConversionRate,
        totalNotes,
        convertedNotes,
        noteConversionRate,
      },
      monthlyChart,
      topCategories,
      topItems,
      weekdayData,
      topDebtors,
    });
  } catch (err) {
    console.error("getAnalyticsOverview error:", err);
    return res.status(500).json({ message: "שגיאה בטעינת הנתונים" });
  }
};

// ─── Helper: بناء بيانات الرسم الشهري ────────────────────────────────────
function buildMonthlyChart(agg) {
  const now = new Date();
  const months = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      label: d.toLocaleDateString("he-IL", { month: "short" }),
      debt: 0,
      payment: 0,
      return: 0,
    });
  }

  for (const row of agg) {
    const m = months.find(
      (m) => m.year === row._id.year && m.month === row._id.month
    );
    if (!m) continue;
    if (row._id.type === "debt") m.debt += Number(row.total);
    if (row._id.type === "payment") m.payment += Number(row.total);
    if (row._id.type === "return") m.return += Number(row.total);
  }

  return months;
}

// ─── Helper: استجابة فارغة ────────────────────────────────────────────────
function emptyResponse() {
  return {
    kpis: {
      totalDebt: 0, totalPaid: 0, customersInDebt: 0, customersCount: 0,
      periodDebts: 0, periodPayments: 0, periodReturns: 0, debtChange: null,
      totalQuotes: 0, convertedQuotes: 0, quoteConversionRate: 0,
      totalNotes: 0, convertedNotes: 0, noteConversionRate: 0,
    },
    monthlyChart: [],
    topCategories: [],
    topItems: [],
    weekdayData: [],
    topDebtors: [],
  };
}

// ─── GET /analytics/debt-distribution ────────────────────────────────────────
export const getDebtDistribution = async (req, res) => {
  try {
    const userId = req.user._id;

    const customers = await Customer.find({ createdBy: userId })
      .select("_id").lean();
    const customerIds = customers.map((c) => c._id);

    if (customerIds.length === 0)
      return res.json({ buckets: [], grandTotal: 0, grandCount: 0 });

    const accounts = await Account.find({
      customer: { $in: customerIds },
      status: "open",
    }).lean();

    const openAccountIds = accounts.map((a) => a._id);
    if (openAccountIds.length === 0)
      return res.json({ buckets: [], grandTotal: 0, grandCount: 0 });

    const balancesAgg = await Transaction.aggregate([
      { $match: { account: { $in: openAccountIds } } },
      {
        $group: {
          _id: "$account",
          debtTotal:    { $sum: { $cond: [{ $eq: ["$type", "debt"] },    "$amount", 0] } },
          paymentTotal: { $sum: { $cond: [{ $eq: ["$type", "payment"] }, "$amount", 0] } },
          returnTotal:  { $sum: { $cond: [{ $eq: ["$type", "return"] },  "$amount", 0] } },
        },
      },
    ]);

    const buckets = [
      { key: "under1k",  label: "עד ₪1,000",          min: 1,     max: 1000,    count: 0, total: 0, color: "#1D9E75" },
      { key: "1k_3k",   label: "₪1,000 – ₪3,000",    min: 1000,  max: 3000,    count: 0, total: 0, color: "#EF9F27" },
      { key: "3k_10k",  label: "₪3,000 – ₪10,000",   min: 3000,  max: 10000,   count: 0, total: 0, color: "#E24B4A" },
      { key: "over10k", label: "מעל ₪10,000",         min: 10000, max: null,    count: 0, total: 0, color: "#534AB7" },
    ];

    let grandTotal = 0, grandCount = 0;

    for (const row of balancesAgg) {
      const balance = Number(row.debtTotal) - Number(row.paymentTotal) - Number(row.returnTotal);
      if (balance <= 0) continue;
      grandTotal += balance;
      grandCount++;
      const bucket = buckets.find((b) => balance >= b.min && (b.max === null || balance < b.max));
      if (bucket) { bucket.count++; bucket.total += balance; }
    }

    const result = buckets.map((b) => ({
      ...b,
      pctCount: grandCount > 0 ? Math.round((b.count / grandCount) * 100) : 0,
      pctTotal: grandTotal > 0 ? Math.round((b.total / grandTotal) * 100) : 0,
    }));

    return res.json({ buckets: result, grandTotal, grandCount });
  } catch (err) {
    console.error("getDebtDistribution error:", err);
    return res.status(500).json({ message: "שגיאה בטעינת נתוני החלוקה" });
  }
};
