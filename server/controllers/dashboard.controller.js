import Customer from "../models/Customer.js";
import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";
import Item from "../models/Item.js";
import Quote from "../models/Quote.js";
import DeliveryNote from "../models/DeliveryNote.js";
import Setting from "../models/Setting.js";
import archiver from "archiver";

// في dashboard.routes.js أو routes منفصل
import ExcelJS from "exceljs";

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

// في dashboard.routes.js أو routes منفصل



// ═══════════════════════════════════════════
// helper: جلب بيانات كاملة للتصدير
// ═══════════════════════════════════════════
async function fetchExportData(userId) {
  const customers = await Customer.find({ createdBy: userId, isActive: true })
    .sort({ fullName: 1 })
    .lean();

  const customerIds = customers.map((c) => c._id);

  const accounts = await Account.find({
    customer: { $in: customerIds },
  }).lean();

  const transactions = await Transaction.find({
    customer: { $in: customerIds },
  })
    .sort({ date: 1 })
    .lean();

  // ← هنا التغيير: قائمة من accounts لكل customer
  const accountMap = {};
  accounts.forEach((acc) => {
    const cid = String(acc.customer);
    if (!accountMap[cid]) accountMap[cid] = [];
    accountMap[cid].push(acc);
  });

  const txMap = {};
  transactions.forEach((tx) => {
    const cid = String(tx.customer);
    if (!txMap[cid]) txMap[cid] = [];
    txMap[cid].push(tx);
  });

  return { customers, customerIds, accountMap, txMap };
}
// ═══════════════════════════════════════════
// export JSON — كامل ومتوافق مع الـ DB
// ═══════════════════════════════════════════

export const exportCustomersJson = async (req, res) => {
  try {
    const userId = req.user._id;

    // ── جلب كل البيانات بالتوازي ──
    const [customers, accounts, transactions, items, quotes, deliveryNotes, setting] =
      await Promise.all([
        Customer.find({ createdBy: userId }).sort({ fullName: 1 }).lean(),
        Account.find({ createdBy: userId }).lean(),
        Transaction.find({ createdBy: userId }).sort({ date: 1 }).lean(),
        Item.find({ createdBy: userId }).sort({ name: 1 }).lean(),
        Quote.find({ createdBy: userId }).sort({ date: -1 }).lean(),
        DeliveryNote.find({ createdBy: userId }).sort({ date: -1 }).lean(),
        Setting.findOne({ createdBy: userId }).lean(),
      ]);

    const customerIds = customers.map((c) => String(c._id));

    const accountMap = {};
    accounts.forEach((acc) => {
      const cid = String(acc.customer);
      if (!accountMap[cid]) accountMap[cid] = [];
      accountMap[cid].push(acc);
    });

    const txMap = {};
    transactions.forEach((tx) => {
      const cid = String(tx.customer);
      if (!txMap[cid]) txMap[cid] = [];
      txMap[cid].push(tx);
    });

    // ══════════════════════════════
    // بناء كل ملف
    // ══════════════════════════════

    const exportedAt = new Date().toISOString();
    const exportedBy = String(userId);

    const _index = {
      exportedAt,
      exportedBy,
      version: "2.0",
      counts: {
        customers: customers.length,
        accounts: accounts.length,
        transactions: transactions.length,
        items: items.length,
        quotes: quotes.length,
        deliveryNotes: deliveryNotes.length,
      },
      files: [
        "_index.json",
        "settings.json",
        "items.json",
        "customers.json",
        "accounts.json",
        "transactions.json",
        "quotes.json",
        "deliveryNotes.json",
      ],
    };

    const settingsData = setting
      ? {
        _id: String(setting._id),
        storeName: setting.storeName || "",
        storePhone: setting.storePhone || "",
        storeAddress: setting.storeAddress || "",
        footerText: setting.footerText || "",
        createdBy: String(setting.createdBy),
        createdAt: setting.createdAt,
        updatedAt: setting.updatedAt,
      }
      : null;

    const itemsData = items.map((item) => ({
      _id: String(item._id),
      name: item.name,
      category: item.category || "",
      price: Number(item.price || 0),
      note: item.note || "",
      isActive: item.isActive,
      createdBy: String(item.createdBy),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    const customersData = customers.map((c) => ({
      _id: String(c._id),
      fullName: c.fullName,
      phone: c.phone || "",
      note: c.note || "",
      isActive: c.isActive,
      createdBy: String(c.createdBy),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    const accountsData = accounts.map((acc) => ({
      _id: String(acc._id),
      customer: String(acc.customer),
      status: acc.status,
      openedAt: acc.openedAt,
      archivedAt: acc.archivedAt || null,
      archiveNote: acc.archiveNote || "",
      zeroedAt: acc.zeroedAt || null,
      createdBy: String(acc.createdBy),
      createdAt: acc.createdAt,
      updatedAt: acc.updatedAt,
    }));

    const transactionsData = transactions.map((tx) => ({
      _id: String(tx._id),
      account: String(tx.account),
      customer: String(tx.customer),
      type: tx.type,
      date: tx.date,
      item: tx.item ? String(tx.item) : null,
      description: tx.description || "",
      quantity: tx.quantity || 0,
      unitPrice: tx.unitPrice || 0,
      amount: Number(tx.amount || 0),
      note: tx.note || "",
      deliveryNote: tx.deliveryNote ? String(tx.deliveryNote) : null,
      createdBy: String(tx.createdBy),
      createdAt: tx.createdAt,
      updatedAt: tx.updatedAt,
    }));

    const quotesData = quotes.map((q) => ({
      _id: String(q._id),
      customer: q.customer ? String(q.customer) : null,
      customerName: q.customerName || "",
      customerPhone: q.customerPhone || "",
      quoteNumber: q.quoteNumber,
      date: q.date,
      status: q.status,
      items: (q.items || []).map((qi) => ({
        date: qi.date,
        item: qi.item ? String(qi.item) : null,
        description: qi.description || "",
        quantity: qi.quantity || 0,
        unitPrice: qi.unitPrice || 0,
        amount: Number(qi.amount || 0),
        note: qi.note || "",
      })),
      total: Number(q.total || 0),
      note: q.note || "",
      convertedAt: q.convertedAt || null,
      convertedAccount: q.convertedAccount ? String(q.convertedAccount) : null,
      createdBy: String(q.createdBy),
      createdAt: q.createdAt,
      updatedAt: q.updatedAt,
    }));

    const deliveryNotesData = deliveryNotes.map((dn) => ({
      _id: String(dn._id),
      customer: String(dn.customer),
      customerName: dn.customerName || "",
      customerPhone: dn.customerPhone || "",
      noteNumber: dn.noteNumber,
      date: dn.date,
      status: dn.status,
      items: (dn.items || []).map((di) => ({
        date: di.date,
        item: di.item ? String(di.item) : null,
        description: di.description || "",
        quantity: di.quantity || 0,
        unitPrice: di.unitPrice || 0,
        amount: Number(di.amount || 0),
        note: di.note || "",
      })),
      total: Number(dn.total || 0),
      note: dn.note || "",
      convertedAt: dn.convertedAt || null,
      convertedAccount: dn.convertedAccount ? String(dn.convertedAccount) : null,
      isDirty: dn.isDirty || false,
      sourceQuote: dn.sourceQuote ? String(dn.sourceQuote) : null,
      createdBy: String(dn.createdBy),
      createdAt: dn.createdAt,
      updatedAt: dn.updatedAt,
    }));

    // ══════════════════════════════
    // بناء الـ ZIP
    // ══════════════════════════════
    const date = new Date().toLocaleDateString("he-IL").replace(/\//g, "-");
    const filename = `גיבוי_מלא_${date}.zip`;

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);

    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.on("error", (err) => {
      console.error("Archiver error:", err);
      if (!res.headersSent) res.status(500).json({ message: "שגיאה ביצירת הקובץ" });
    });

    archive.pipe(res);

    const toBuffer = (data) => Buffer.from(JSON.stringify(data, null, 2), "utf-8");

    archive.append(toBuffer(_index), { name: "_index.json" });
    archive.append(toBuffer(settingsData), { name: "settings.json" });
    archive.append(toBuffer(itemsData), { name: "items.json" });
    archive.append(toBuffer(customersData), { name: "customers.json" });
    archive.append(toBuffer(accountsData), { name: "accounts.json" });
    archive.append(toBuffer(transactionsData), { name: "transactions.json" });
    archive.append(toBuffer(quotesData), { name: "quotes.json" });
    archive.append(toBuffer(deliveryNotesData), { name: "deliveryNotes.json" });

    await archive.finalize();

  } catch (err) {
    console.error("exportCustomersJson error:", err);
    if (!res.headersSent) res.status(500).json({ message: "שגיאה בייצוא הגיבוי" });
  }
};
// ═══════════════════════════════════════════
// export Excel
// ═══════════════════════════════════════════
export const exportCustomersExcel = async (req, res) => {
  try {
    const userId = req.user._id;
    const { customers, accountMap, txMap } = await fetchExportData(userId);

    if (customers.length === 0)
      return res.status(404).json({ message: "אין לקוחות לייצוא" });

    const HEADER_BG = "FF534AB7";
    const SUBHEAD_BG = "FFEEEDFE";
    const DEBT_BG = "FFFCEBEB";
    const PAYMENT_BG = "FFE1F5EE";
    const RETURN_BG = "FFFAEEDA";
    const SUMMARY_BG = "FFF1EFE8";
    const WHITE_BG = "FFFFFFFF";
    const STRIPE_BG = "FFF9F9F9";

    const border = {
      top: { style: "thin", color: { argb: "FFE0E0E0" } },
      left: { style: "thin", color: { argb: "FFE0E0E0" } },
      bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
      right: { style: "thin", color: { argb: "FFE0E0E0" } },
    };

    const styleCell = (cell, { bgColor, fontColor = "FF1A1A1A", bold = false, align = "right", size = 10 } = {}) => {
      if (bgColor) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
      cell.font = { name: "Arial", bold, size, color: { argb: fontColor } };
      cell.alignment = { horizontal: align, vertical: "middle", readingOrder: "rightToLeft" };
      cell.border = border;
    };

    const typeMap = { debt: "חוב", payment: "תשלום", return: "החזרה" };
    const typeColor = { debt: "FFA32D2D", payment: "FF0F6E56", return: "FF854F0B" };

    const workbook = new ExcelJS.Workbook();

    // ── סיכום כללי ──
    const sumSheet = workbook.addWorksheet("סיכום כללי");
    sumSheet.views = [{ rightToLeft: true }];
    sumSheet.columns = [
      { width: 24 }, { width: 16 }, { width: 14 },
      { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 },
    ];

    const sumHeaderRow = sumSheet.addRow(["שם לקוח", "טלפון", "חובות", "תשלומים", "יתרת חוב", "מס׳ עסקאות", "תאריך פתיחה"]);
    sumHeaderRow.height = 26;
    sumHeaderRow.eachCell((cell) =>
      styleCell(cell, { bgColor: HEADER_BG, fontColor: "FFFFFFFF", bold: true, align: "center", size: 11 })
    );

    customers.forEach((c, idx) => {
      const txs = txMap[String(c._id)] || [];
      const acc = accountMap[String(c._id)];
      const debts = txs.filter(t => t.type === "debt").reduce((s, t) => s + Number(t.amount || 0), 0);
      const payments = txs.filter(t => t.type === "payment").reduce((s, t) => s + Number(t.amount || 0), 0);
      const returns = txs.filter(t => t.type === "return").reduce((s, t) => s + Number(t.amount || 0), 0);
      const balance = debts - payments - returns;
      let openedStr = "—";
      if (acc?.openedAt) {
        try { openedStr = new Date(acc.openedAt).toLocaleDateString("he-IL"); } catch (_) { }
      }

      const bg = idx % 2 === 0 ? WHITE_BG : STRIPE_BG;
      const row = sumSheet.addRow([c.fullName, c.phone || "—", debts, payments, balance, txs.length, openedStr]);
      row.height = 20;
      row.eachCell((cell, col) => {
        let fc = "FF1A1A1A";
        if (col === 3) fc = "FFA32D2D";
        if (col === 4) fc = "FF0F6E56";
        if (col === 5) fc = balance > 0 ? "FF534AB7" : "FF0F6E56";
        styleCell(cell, { bgColor: bg, fontColor: fc, bold: col === 1 });
        if ([3, 4, 5].includes(col)) cell.numFmt = "#,##0";
      });
    });

    // ── שיט לכל לקוח ──
    customers.forEach((c) => {
      const txs = txMap[String(c._id)] || [];
      const acc = accountMap[String(c._id)];
      const ws = workbook.addWorksheet((c.fullName || "לקוח").slice(0, 31));
      ws.views = [{ rightToLeft: true }];
      ws.columns = [
        { width: 14 }, { width: 12 }, { width: 32 },
        { width: 8 }, { width: 14 }, { width: 14 }, { width: 22 },
      ];

      ws.mergeCells("A1:G1");
      const titleCell = ws.getCell("A1");
      titleCell.value = `פרטי לקוח: ${c.fullName}`;
      styleCell(titleCell, { bgColor: HEADER_BG, fontColor: "FFFFFFFF", bold: true, align: "center", size: 12 });
      ws.getRow(1).height = 28;

      ws.getCell("A2").value = "שם לקוח:";
      ws.getCell("B2").value = c.fullName;
      ws.getCell("D2").value = "טלפון:";
      ws.getCell("E2").value = c.phone || "—";
      ws.getCell("F2").value = "תאריך פתיחה:";
      let openedStr = "—";
      if (acc?.openedAt) {
        try { openedStr = new Date(acc.openedAt).toLocaleDateString("he-IL"); } catch (_) { }
      }
      ws.getCell("G2").value = openedStr;
      ["A", "B", "C", "D", "E", "F", "G"].forEach((col) => {
        styleCell(ws.getCell(`${col}2`), {
          bgColor: SUBHEAD_BG, fontColor: "FF3C3489",
          bold: ["A", "D", "F"].includes(col),
        });
      });
      ws.getRow(2).height = 22;
      ws.getRow(3).height = 8;

      const headerRow = ws.addRow(["תאריך", "סוג", "תיאור / פריט", "כמות", "מחיר יחידה", "סכום (₪)", "הערה"]);
      headerRow.height = 24;
      headerRow.eachCell((cell) =>
        styleCell(cell, { bgColor: HEADER_BG, fontColor: "FFFFFFFF", bold: true, align: "center", size: 11 })
      );

      if (txs.length === 0) {
        ws.mergeCells("A5:G5");
        const e = ws.getCell("A5");
        e.value = "אין עסקאות";
        styleCell(e, { bgColor: WHITE_BG, fontColor: "FFAAAAAA", align: "center" });
        ws.getRow(5).height = 20;
      } else {
        txs.forEach((tx) => {
          const t = tx.type;
          const bg = t === "debt" ? DEBT_BG : t === "payment" ? PAYMENT_BG : RETURN_BG;
          const row = ws.addRow([
            tx.date ? new Date(tx.date).toLocaleDateString("he-IL") : "—",
            typeMap[t] || t,
            tx.description || "—",
            t === "payment" ? "—" : (tx.quantity || "—"),
            t === "payment" ? "—" : (tx.unitPrice || "—"),
            Number(tx.amount || 0),
            tx.note || "",
          ]);
          row.height = 20;
          row.eachCell((cell, col) => {
            styleCell(cell, {
              bgColor: bg,
              fontColor: col === 2 ? typeColor[t] : "FF1A1A1A",
              bold: col === 2,
            });
            if (col === 6) cell.numFmt = "#,##0";
          });
        });
      }

      ws.addRow([]);

      const debts = txs.filter(t => t.type === "debt").reduce((s, t) => s + Number(t.amount || 0), 0);
      const payments = txs.filter(t => t.type === "payment").reduce((s, t) => s + Number(t.amount || 0), 0);
      const returns = txs.filter(t => t.type === "return").reduce((s, t) => s + Number(t.amount || 0), 0);
      const balance = debts - payments - returns;

      [
        ["סה״כ חובות:", debts, "FFA32D2D"],
        ["סה״כ תשלומים:", payments, "FF0F6E56"],
        ["סה״כ החזרות:", returns, "FF854F0B"],
        ["יתרת חוב:", balance, "FF534AB7"],
      ].forEach(([label, val, fc]) => {
        const row = ws.addRow([label, val]);
        row.height = 22;
        styleCell(row.getCell(1), { bgColor: SUMMARY_BG, fontColor: fc, bold: true });
        styleCell(row.getCell(2), { bgColor: SUMMARY_BG, fontColor: fc, bold: true });
        row.getCell(2).numFmt = "#,##0";
        for (let col = 3; col <= 7; col++)
          styleCell(row.getCell(col), { bgColor: SUMMARY_BG });
      });
    });

    const date = new Date().toLocaleDateString("he-IL").replace(/\//g, "-");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(`לקוחות_${date}.xlsx`)}`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("exportCustomersExcel error:", err);
    res.status(500).json({ message: "שגיאה בייצוא הנתונים" });
  }
};