import Item from "../models/Item.js";

export const createItem = async (req, res) => {
  const { name, category, price, costPrice, profitMargin, note, barcode } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ message: "יש להזין שם פריט." });
  }

  const item = await Item.create({
    name: name.trim(),
    category: category?.trim() || "",
    price: Number(price || 0),
    costPrice: Number(costPrice || 0),
    profitMargin: Number(profitMargin || 0),
    barcode: barcode?.trim() || "",
    note: note?.trim() || "",
    createdBy: req.user._id,
  });

  return res.status(201).json({ message: "הפריט נוצר בהצלחה.", item });
};

export const getItems = async (req, res) => {
  const items = await Item.find({ createdBy: req.user._id, isActive: true }).sort({ name: 1 });
  return res.status(200).json(items);
};

export const updateItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { name, category, price, costPrice, profitMargin, note, barcode } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "יש להזין שם פריט." });
    }

    const item = await Item.findOneAndUpdate(
      { _id: itemId, createdBy: req.user._id },
      {
        name: name.trim(),
        category: category?.trim() || "",
        price: Number(price || 0),
        costPrice: Number(costPrice || 0),
        profitMargin: Number(profitMargin || 0),
        barcode: barcode?.trim() || "",
        note: note?.trim() || "",
      },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ message: "פריט לא נמצא." });
    }

    return res.status(200).json({ message: "הפריט עודכן בהצלחה.", item });
  } catch (err) {
    console.error("updateItem error:", err);
    return res.status(500).json({ message: "שגיאה בעדכון הפריט." });
  }
};
