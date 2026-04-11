import Transaction from "../models/Transaction.js";
import Account from "../models/Account.js";

// ➕ إضافة حركة (חוב / תשלום / החזרה)
export const addTransaction = async (req, res) => {
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

  const transaction = await Transaction.create({
    account: account._id,
    customer: account.customer,
    type,
    date,
    item: item || null,
    description: description || "",
    quantity: quantity || 0,
    unitPrice: unitPrice || 0,
    amount,
    note: note || "",
    createdBy: req.user._id,
  });

  // 🔥 حساب الرصيد بعد الإضافة
  const transactions = await Transaction.find({
    account: account._id,
  });

  let balance = 0;

  transactions.forEach((t) => {
    if (t.type === "debt") balance += t.amount;
    if (t.type === "payment") balance -= t.amount;
    if (t.type === "return") balance -= t.amount;
  });

  let shouldAskArchive = false;

  if (balance === 0) {
    shouldAskArchive = true;

    account.zeroedAt = new Date();
    await account.save();
  }

  res.status(201).json({
    message: "הפעולה נוספה בהצלחה.",
    transaction,
    balance,
    shouldAskArchive,
  });
};


export const updateTransaction = async (req, res) => {
  const { transactionId } = req.params;
  const { type, date, description, quantity, unitPrice, amount } = req.body;

  const transaction = await Transaction.findById(transactionId);

  if (!transaction) {
    return res.status(404).json({
      message: "הפעולה לא נמצאה.",
    });
  }

  transaction.type = type ?? transaction.type;
  transaction.date = date ?? transaction.date;
  transaction.description = description ?? transaction.description;
  transaction.quantity = quantity ?? transaction.quantity;
  transaction.unitPrice = unitPrice ?? transaction.unitPrice;
  transaction.amount = amount ?? transaction.amount;

  await transaction.save();

  const account = await Account.findById(transaction.account);
  const transactions = await Transaction.find({ account: transaction.account });

  let balance = 0;
  transactions.forEach((t) => {
    if (t.type === "debt") balance += t.amount;
    if (t.type === "payment") balance -= t.amount;
    if (t.type === "return") balance -= t.amount;
  });

  if (balance === 0) {
    account.zeroedAt = new Date();
  } else {
    account.zeroedAt = null;
  }

  await account.save();

  return res.status(200).json({
    message: "הפעולה עודכנה בהצלחה.",
    transaction,
    balance,
  });
};
export const deleteTransaction = async (req, res) => {
  const { transactionId } = req.params;

  const transaction = await Transaction.findById(transactionId);

  if (!transaction) {
    return res.status(404).json({
      message: "הפעולה לא נמצאה.",
    });
  }

  const account = await Account.findById(transaction.account);

  await transaction.deleteOne();

  const transactions = await Transaction.find({ account: account._id });

  let balance = 0;
  transactions.forEach((t) => {
    if (t.type === "debt") balance += t.amount;
    if (t.type === "payment") balance -= t.amount;
    if (t.type === "return") balance -= t.amount;
  });

  if (balance === 0 && transactions.length > 0) {
    account.zeroedAt = new Date();
  } else {
    account.zeroedAt = null;
  }

  await account.save();

  return res.status(200).json({
    message: "הפעולה נמחקה בהצלחה.",
    balance,
  });
};