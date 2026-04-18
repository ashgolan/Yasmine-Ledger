import DeliveryNote from "../models/DeliveryNote.js";
import Customer from "../models/Customer.js";
import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";
import Counter from "../models/Counter.js";

// ── ترقيم مستقل DN-0001 ──
const generateNoteNumber = async () => {
  const counter = await Counter.findOneAndUpdate(
    { key: "deliveryNoteNumber" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `DN-${String(counter.seq).padStart(4, "0")}`;
};

// ── إنشاء تعودة شحن ──
export const createDeliveryNote = async (req, res) => {
  try {
    const { customer, customerName, customerPhone, date, items, note, sourceQuote } = req.body;

    if (!customer) {
      return res.status(400).json({ message: "יש לבחור לקוח." });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "יש להוסיף לפחות שורה אחת." });
    }

    const total = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const deliveryNote = await DeliveryNote.create({
      customer,
      customerName: customerName?.trim() || "",
      customerPhone: customerPhone?.trim() || "",
      noteNumber: await generateNoteNumber(),
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
      sourceQuote: sourceQuote || null,
      createdBy: req.user._id,
    });

    return res.status(201).json({ message: "תעודת המשלוח נוצרה בהצלחה.", deliveryNote });
  } catch (err) {
    console.error("createDeliveryNote error:", err);
    return res.status(500).json({ message: "שגיאה ביצירת תעודת המשלוח." });
  }
};

// ── جلب كل تعودات الشحن ──
export const getDeliveryNotes = async (req, res) => {
  try {
    const notes = await DeliveryNote.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .populate("customer", "fullName phone")
      .populate("convertedAccount");

    return res.status(200).json(notes);
  } catch (err) {
    console.error("getDeliveryNotes error:", err);
    return res.status(500).json({ message: "שגיאה בטעינת תעודות המשלוח." });
  }
};

// ── جلب تعودة واحدة ──
export const getDeliveryNoteById = async (req, res) => {
  try {
    const note = await DeliveryNote.findById(req.params.noteId)
      .populate("customer", "fullName phone")
      .populate("convertedAccount");

    if (!note) return res.status(404).json({ message: "תעודת המשלוח לא נמצאה." });

    return res.status(200).json(note);
  } catch (err) {
    return res.status(500).json({ message: "שגיאה בטעינת תעודת המשלוח." });
  }
};

// ── ספירת תעודות משלוח לפי לקוח ──────────────────────────────────────────
export const getDeliveryNoteCountByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const count = await DeliveryNote.countDocuments({
      customer: customerId,
      createdBy: req.user._id,
    });
    return res.status(200).json({ count });
  } catch (err) {
    console.error("getDeliveryNoteCountByCustomer error:", err);
    return res.status(500).json({ message: "שגיאה בספירת תעודות המשלוח" });
  }
};

// ── تحويل لحساب الزبون ──
export const convertDeliveryNoteToAccount = async (req, res) => {
  try {
    const { noteId } = req.params;
    const userId = req.user._id;

    const note = await DeliveryNote.findById(noteId);
    if (!note) return res.status(404).json({ message: "תעודת המשלוח לא נמצאה." });
    if (String(note.createdBy) !== String(userId))
      return res.status(403).json({ message: "אין הרשאה לבצע פעולה זו." });
    if (note.status === "converted")
      return res.status(400).json({ message: "תעודת המשלוח כבר הומרה לחשבון." });
    if (!note.items || note.items.length === 0)
      return res.status(400).json({ message: "לא ניתן להמיר תעודה ריקה." });

    let account = await Account.findOne({ customer: note.customer, status: "open" });
    if (!account) {
      account = await Account.create({
        customer: note.customer,
        status: "open",
        openedAt: new Date(),
        createdBy: userId,
      });
    }

    const transactionsToInsert = note.items.map((item) => ({
      account: account._id,
      customer: note.customer,
      type: "debt",
      date: item.date || note.date || new Date(),
      item: item.item || null,
      description: item.description?.trim() || "",
      quantity: Number(item.quantity || 0),
      unitPrice: Number(item.unitPrice || 0),
      amount: Number(item.amount || 0),
      note: item.note?.trim() || note.note?.trim() || "",
      createdBy: userId,
    }));

    await Transaction.insertMany(transactionsToInsert);

    note.status = "converted";
    note.convertedAt = new Date();
    note.convertedAccount = account._id;
    note.isDirty = false;
    await note.save();

    return res.status(200).json({
      message: "תעודת המשלוח הומרה לחשבון בהצלחה.",
      accountId: account._id,
      customerId: note.customer,
      note,
    });
  } catch (err) {
    console.error("convertDeliveryNoteToAccount error:", err);
    return res.status(500).json({ message: "שגיאה בהמרת תעודת המשלוח." });
  }
};

// ── تعديل تعودة ──
export const updateDeliveryNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { items, note, date } = req.body;
    const userId = req.user._id;

    const deliveryNote = await DeliveryNote.findById(noteId);
    if (!deliveryNote) return res.status(404).json({ message: "תעודת המשלוח לא נמצאה." });
    if (String(deliveryNote.createdBy) !== String(userId))
      return res.status(403).json({ message: "אין הרשאה." });

    deliveryNote.items = items.map((item) => ({
      date: item.date,
      description: item.description?.trim() || "",
      quantity: Number(item.quantity || 0),
      unitPrice: Number(item.unitPrice || 0),
      amount: Number(item.amount || 0),
      note: item.note?.trim() || "",
      item: item.item || null,
    }));
    deliveryNote.total = items.reduce((s, i) => s + Number(i.amount || 0), 0);
    deliveryNote.note = note?.trim() || "";
    deliveryNote.date = date || deliveryNote.date;

    if (deliveryNote.status === "converted") {
      deliveryNote.isDirty = true;
    }

    await deliveryNote.save();
    return res.status(200).json({ message: "תעודת המשלוח עודכנה.", deliveryNote });
  } catch (err) {
    console.error("updateDeliveryNote error:", err);
    return res.status(500).json({ message: "שגיאה בעדכון תעודת המשלוח." });
  }
};

// ── مزامنة مع الحساب بعد التعديل ──
export const syncDeliveryNoteToAccount = async (req, res) => {
  try {
    const { noteId } = req.params;
    const userId = req.user._id;

    const note = await DeliveryNote.findById(noteId);
    if (!note) return res.status(404).json({ message: "תעודת המשלוח לא נמצאה." });
    if (!note.convertedAccount) return res.status(400).json({ message: "אין חשבון מקושר." });

    const account = await Account.findById(note.convertedAccount);
    if (!account || account.status !== "open")
      return res.status(400).json({ message: "החשבון אינו זמין." });

    await Transaction.deleteMany({ account: account._id, deliveryNote: note._id });

    const transactionsToInsert = note.items.map((item) => ({
      account: account._id,
      customer: note.customer,
      type: "debt",
      date: item.date || note.date || new Date(),
      item: item.item || null,
      description: item.description?.trim() || "",
      quantity: Number(item.quantity || 0),
      unitPrice: Number(item.unitPrice || 0),
      amount: Number(item.amount || 0),
      note: item.note?.trim() || "",
      createdBy: userId,
    }));

    await Transaction.insertMany(transactionsToInsert);

    note.isDirty = false;
    await note.save();

    return res.status(200).json({ message: "החשבון עודכן בהצלחה.", note });
  } catch (err) {
    console.error("syncDeliveryNoteToAccount error:", err);
    return res.status(500).json({ message: "שגיאה בסנכרון." });
  }
};
