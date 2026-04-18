import Quote from "../models/Quote.js";
import Customer from "../models/Customer.js";
import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";
import Counter from "../models/Counter.js";

const generateQuoteNumber = async () => {
    const counter = await Counter.findOneAndUpdate(
        { key: "quoteNumber" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return `Q-${String(counter.seq).padStart(4, "0")}`;
};

export const createQuote = async (req, res) => {
    const { customer, customerName, customerPhone, date, items, note } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "יש להוסיף לפחות שורה אחת להצעת המחיר." });
    }

    const total = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const quote = await Quote.create({
        customer: customer || null,
        customerName: customerName?.trim() || "",
        customerPhone: customerPhone?.trim() || "",
        quoteNumber: await generateQuoteNumber(),
        date: date || new Date(),
        items: items.map((item) => ({
            date: item.date,
            description: item.description?.trim() || "",
            quantity: Number(item.quantity || 0),
            unitPrice: Number(item.unitPrice || 0),
            amount: Number(item.amount || 0),
            note: item.note?.trim() || "",
            item: item.item || null,
        })),
        total,
        note: note?.trim() || "",
        createdBy: req.user._id,
    });

    return res.status(201).json({ message: "הצעת המחיר נוצרה בהצלחה.", quote });
};

export const getQuotes = async (req, res) => {
    const quotes = await Quote.find()
        .sort({ createdAt: -1 })
        .populate("customer", "fullName phone")
        .populate("convertedAccount");

    return res.status(200).json(quotes);
};

export const getQuoteById = async (req, res) => {
    const quote = await Quote.findById(req.params.quoteId)
        .populate("customer", "fullName phone")
        .populate("convertedAccount");

    if (!quote) {
        return res.status(404).json({ message: "הצעת המחיר לא נמצאה." });
    }

    return res.status(200).json(quote);
};

// ── ספירת הצעות מחיר + תעודות משלוח לפי לקוח ──────────────────────────────
export const getQuoteCountByCustomer = async (req, res) => {
    try {
        const { customerId } = req.params;
        const count = await Quote.countDocuments({
            customer: customerId,
            createdBy: req.user._id,
        });
        return res.status(200).json({ count });
    } catch (err) {
        console.error("getQuoteCountByCustomer error:", err);
        return res.status(500).json({ message: "שגיאה בספירת הצעות המחיר" });
    }
};

export const convertQuoteToAccount = async (req, res) => {
    try {
        const { quoteId } = req.params;
        const userId = req.user._id;

        const quote = await Quote.findById(quoteId);

        if (!quote) {
            return res.status(404).json({ message: "הצעת המחיר לא נמצאה." });
        }

        if (String(quote.createdBy) !== String(userId)) {
            return res.status(403).json({ message: "אין הרשאה לבצע פעולה זו." });
        }

        if (quote.status === "converted") {
            return res.status(400).json({
                message: "הצעת המחיר כבר הומרה לחשבון.",
                accountId: quote.convertedAccount || null,
                customerId: quote.customer || null,
            });
        }

        if (!quote.items || quote.items.length === 0) {
            return res.status(400).json({ message: "לא ניתן להמיר הצעת מחיר ריקה." });
        }

        let customerId = quote.customer;

        if (!customerId) {
            const customerName = quote.customerName?.trim() || "";
            const customerPhone = quote.customerPhone?.trim() || "";

            if (!customerName) {
                return res.status(400).json({ message: "לא ניתן להמיר הצעת מחיר ללא שם לקוח." });
            }

            const newCustomer = await Customer.create({
                fullName: customerName,
                phone: customerPhone,
                note: `נוצר אוטומטית מתוך הצעת מחיר ${quote.quoteNumber}`,
                isActive: true,
                createdBy: userId,
            });

            customerId = newCustomer._id;
            quote.customer = newCustomer._id;
        }

        let account = await Account.findOne({ customer: customerId, status: "open" });

        if (!account) {
            account = await Account.create({
                customer: customerId,
                status: "open",
                openedAt: new Date(),
                createdBy: userId,
            });
        }

        const transactionsToInsert = quote.items.map((item) => ({
            account: account._id,
            customer: customerId,
            type: "debt",
            date: item.date || quote.date || new Date(),
            item: item.item || null,
            description: item.description?.trim() || "",
            quantity: Number(item.quantity || 0),
            unitPrice: Number(item.unitPrice || 0),
            amount: Number(item.amount || 0),
            note: item.note?.trim() || quote.note?.trim() || "",
            createdBy: userId,
        }));

        await Transaction.insertMany(transactionsToInsert);

        quote.status = "converted";
        quote.convertedAt = new Date();
        quote.convertedAccount = account._id;
        await quote.save();

        return res.status(200).json({
            message: "הצעת המחיר הומרה לחשבון בהצלחה.",
            accountId: account._id,
            customerId,
            quote,
        });
    } catch (error) {
        console.error("convertQuoteToAccount error:", error);
        return res.status(500).json({ message: "אירעה שגיאה בהמרת הצעת המחיר לחשבון." });
    }
};
