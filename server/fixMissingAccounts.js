// fixMissingAccounts.js
// شغّل هذا الملف مرة واحدة فقط لإصلاح الزبائن القدامى
// الأمر: node fixMissingAccounts.js

import mongoose from "mongoose";
import dotenv from "dotenv";
import Customer from "./models/Customer.js";
import Account from "./models/Account.js";

dotenv.config();

const fix = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB");

  const customers = await Customer.find({ isActive: true });
  console.log(`📋 Found ${customers.length} customers`);

  let fixed = 0;

  for (const c of customers) {
    const exists = await Account.findOne({ customer: c._id, status: "open" });
    if (!exists) {
      await Account.create({
        customer: c._id,
        status: "open",
        createdBy: c.createdBy,
      });
      console.log(`➕ Created account for: ${c.fullName}`);
      fixed++;
    }
  }

  console.log(`\n✅ Done! Fixed ${fixed} customers.`);
  await mongoose.disconnect();
  process.exit(0);
};

fix().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
