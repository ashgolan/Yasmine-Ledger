import Item from "../models/Item.js";

export const createItem = async (req, res) => {
  const { name, category, price, note } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({
      message: "יש להזין שם פריט.",
    });
  }

  const item = await Item.create({
    name: name.trim(),
    category: category?.trim() || "",
    price: Number(price || 0),
    note: note?.trim() || "",
    createdBy: req.user._id,
  });

  return res.status(201).json({
    message: "הפריט נוצר בהצלחה.",
    item,
  });
};

export const getItems = async (req, res) => {
  const items = await Item.find({ isActive: true }).sort({ name: 1 });

  return res.status(200).json(items);
};