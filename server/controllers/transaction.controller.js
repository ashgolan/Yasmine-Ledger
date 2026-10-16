import Transaction from "../models/Transaction.js";
import Account from "../models/Account.js";

// ─── helper: חישוב יתרת חשבון ───────────────────────────────────────────────
const calcBalance = (transactions) => {
  let balance = 0;
  for (const t of transactions) {
    if (t.type === "debt") balance += t.amount;
    if (t.type === "payment") balance -= t.amount;
    if (t.type === "return") balance -= t.amount;
  }
  return Math.round(balance * 100) / 100;
};

const isOwner = (doc, user) => String(doc.createdBy) === String(user._id);

// ➕ הוספת חרך
export const addTransaction = async (req, res) => {
  try {
    const {
      accountId,
      type,
      date,
      item,
      description,
      quantity,
      unitPrice,
      amount,
      note,
    } = req.body;

    if (!accountId || !type || !date || !amount) {
      return res.status(400).json({
        message: "יש למלא את כל השדות החיוניים.",
      });
    }

    const account = await Account.findById(accountId);

    if (!account || account.status !== "open") {
      return res.status(400).json({
        message: "החשבון אינו זמין.",
      });
    }

    if (!isOwner(account, req.user)) {
      return res.status(403).json({ message: "אין הרשאה." });
    }

    const transaction = await Transaction.create({
      account: account._id,
      customer: account.customer,
      type,
      date: new Date(date),
      item: item || null,
      description: description || "",
      quantity: quantity || 0,
      unitPrice: unitPrice || 0,
      amount,
      note: note || "",
      createdBy: req.user._id,
    });

    const allTransactions = await Transaction.find({ account: account._id });
    const balance = calcBalance(allTransactions);
    let shouldAskArchive = false;

    if (balance === 0) {
      shouldAskArchive = true;
      account.zeroedAt = new Date();
      await account.save();
    }

    return res.status(201).json({
      message: "הפעולה נוספה בהצלחה.",
      transaction,
      balance,
      shouldAskArchive,
    });
  } catch (err) {
    console.error("addTransaction error:", err);
    return res.status(500).json({ message: "שגיאה בהוספת הפעולה." });
  }
};

// ✏️ עדכון חרך
export const updateTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { type, date, description, quantity, unitPrice, amount, note } = req.body;

    if (amount !== undefined && !(Number(amount) > 0)) {
      return res.status(400).json({ message: "סכום לא תקין." });
    }

    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      return res.status(404).json({ message: "הפעולה לא נמצאה." });
    }

    if (!isOwner(transaction, req.user)) {
      return res.status(403).json({ message: "אין הרשאה." });
    }

    transaction.type = type ?? transaction.type;
    transaction.date = date ? new Date(date) : transaction.date;
    transaction.description = description ?? transaction.description;
    transaction.quantity = quantity ?? transaction.quantity;
    transaction.unitPrice = unitPrice ?? transaction.unitPrice;
    transaction.amount = amount ?? transaction.amount;
    transaction.note = note ?? transaction.note;
    await transaction.save();

    const allTransactions = await Transaction.find({ account: transaction.account });
    const balance = calcBalance(allTransactions);

    const account = await Account.findById(transaction.account);
    if (account) {
      account.zeroedAt = balance === 0 ? (account.zeroedAt || new Date()) : null;
      await account.save();
    }

    return res.status(200).json({
      message: "הפעולה עודכנה בהצלחה.",
      transaction,
      balance,
    });
  } catch (err) {
    console.error("updateTransaction error:", err);
    return res.status(500).json({ message: "שגיאה בעדכון הפעולה." });
  }
};

// 🗑️ מחיקת חרך
export const deleteTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      return res.status(404).json({ message: "הפעולה לא נמצאה." });
    }

    if (!isOwner(transaction, req.user)) {
      return res.status(403).json({ message: "אין הרשאה." });
    }

    const accountId = transaction.account;
    await transaction.deleteOne();

    const allTransactions = await Transaction.find({ account: accountId });
    const balance = calcBalance(allTransactions);

    const account = await Account.findById(accountId);
    if (account) {
      account.zeroedAt = (balance === 0 && allTransactions.length > 0) ? new Date() : null;
      await account.save();
    }

    return res.status(200).json({
      message: "הפעולה נמחקה בהצלחה.",
      balance,
    });
  } catch (err) {
    console.error("deleteTransaction error:", err);
    return res.status(500).json({ message: "שגיאה במחיקת הפעולה." });
  }
};