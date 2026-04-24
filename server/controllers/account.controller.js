import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";

// الحساب الحالي
export const getCustomerAccount = async (req, res) => {
  const { customerId } = req.params;

  const account = await Account.findOne({
    customer: customerId,
    status: "open",
  }).populate("customer", "fullName phone idNumber")


  if (!account) {
    return res.status(404).json({
      message: "לא נמצא חשבון פתוח ללקוח.",
    });
  }

  const transactions = await Transaction.find({
    account: account._id,
  }).sort({ date: 1, createdAt: 1 });

  let balance = 0;

  transactions.forEach((t) => {
    if (t.type === "debt") balance += t.amount;
    if (t.type === "payment") balance -= t.amount;
    if (t.type === "return") balance -= t.amount;
  });

  res.status(200).json({
    account,
    transactions,
    balance,
  });
};

// أرشفة الحساب
export const archiveAccount = async (req, res) => {
  const { accountId } = req.params;

  const account = await Account.findById(accountId);

  if (!account) {
    return res.status(404).json({
      message: "החשבון לא נמצא.",
    });
  }

  account.status = "archived";
  account.archivedAt = new Date();

  await account.save();

  const newAccount = await Account.create({
    customer: account.customer,
    createdBy: req.user._id,
  });

  res.status(200).json({
    message: "החשבון אורכב בהצלחה.",
    newAccount,
  });
};

// كل الحسابات المؤرشفة لزبون
export const getCustomerArchivedAccounts = async (req, res) => {
  const { customerId } = req.params;

  const archivedAccounts = await Account.find({
    customer: customerId,
    status: "archived",
  }).sort({ archivedAt: -1, createdAt: -1 });

  const results = [];

  for (const account of archivedAccounts) {
    const transactions = await Transaction.find({
      account: account._id,
    }).sort({ date: 1, createdAt: 1 });

    let debtsTotal = 0;
    let paymentsTotal = 0;
    let returnsTotal = 0;

    transactions.forEach((t) => {
      if (t.type === "debt") debtsTotal += Number(t.amount || 0);
      if (t.type === "payment") paymentsTotal += Number(t.amount || 0);
      if (t.type === "return") returnsTotal += Number(t.amount || 0);
    });

    results.push({
      account,
      transactionsCount: transactions.length,
      debtsTotal,
      paymentsTotal,
      returnsTotal,
      finalBalance: debtsTotal - paymentsTotal - returnsTotal,
    });
  }

  return res.status(200).json(results);
};

// تفاصيل حساب مؤرشف واحد
export const getArchivedAccountDetails = async (req, res) => {
  const { accountId } = req.params;

  const account = await Account.findById(accountId);

  if (!account || account.status !== "archived") {
    return res.status(404).json({
      message: "החשבון בארכיון לא נמצא.",
    });
  }

  const transactions = await Transaction.find({
    account: account._id,
  }).sort({ date: 1, createdAt: 1 });

  let balance = 0;

  transactions.forEach((t) => {
    if (t.type === "debt") balance += t.amount;
    if (t.type === "payment") balance -= t.amount;
    if (t.type === "return") balance -= t.amount;
  });

  return res.status(200).json({
    account,
    transactions,
    balance,
  });
};