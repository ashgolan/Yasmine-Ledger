import cron from "node-cron";
import nodemailer from "nodemailer";
import archiver from "archiver";
import { PassThrough } from "stream";

import Customer from "../models/Customer.js";
import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";
import Item from "../models/Item.js";
import Quote from "../models/Quote.js";
import DeliveryNote from "../models/DeliveryNote.js";
import Setting from "../models/Setting.js";
import Counter from "../models/Counter.js";
import User from "../models/User.js";

// ── Nodemailer transporter ──────────────────────────────────────────────────
const createTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

// ── Build ZIP buffer in memory ───────────────────────────────────────────────
async function generateBackupZip(userId) {
  const [customers, accounts, transactions, items, quotes, deliveryNotes, setting, counters] =
    await Promise.all([
      Customer.find({ createdBy: userId }).lean(),
      Account.find({ createdBy: userId }).lean(),
      Transaction.find({ createdBy: userId }).lean(),
      Item.find({ createdBy: userId }).lean(),
      Quote.find({ createdBy: userId }).lean(),
      DeliveryNote.find({ createdBy: userId }).lean(),
      Setting.findOne({ createdBy: userId }).lean(),
      Counter.find({}).lean(),
    ]);

  return new Promise((resolve, reject) => {
    const passThrough = new PassThrough();
    const chunks = [];
    passThrough.on("data", (chunk) => chunks.push(chunk));
    passThrough.on("end", () => resolve(Buffer.concat(chunks)));
    passThrough.on("error", reject);

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("error", reject);
    archive.pipe(passThrough);

    const toBuffer = (data) =>
      Buffer.from(JSON.stringify(data, null, 2), "utf-8");

    const exportedAt = new Date().toISOString();

    archive.append(
      toBuffer({
        exportedAt,
        exportedBy: String(userId),
        version: "2.1",
        counts: {
          customers: customers.length,
          accounts: accounts.length,
          transactions: transactions.length,
          items: items.length,
          quotes: quotes.length,
          deliveryNotes: deliveryNotes.length,
          counters: counters.length,
        },
        files: [
          "_index.json", "settings.json", "items.json",
          "customers.json", "accounts.json", "transactions.json",
          "quotes.json", "deliveryNotes.json", "counters.json",
        ],
      }),
      { name: "_index.json" }
    );
    archive.append(toBuffer(setting || {}),    { name: "settings.json" });
    archive.append(toBuffer(items),            { name: "items.json" });
    archive.append(toBuffer(customers),        { name: "customers.json" });
    archive.append(toBuffer(accounts),         { name: "accounts.json" });
    archive.append(toBuffer(transactions),     { name: "transactions.json" });
    archive.append(toBuffer(quotes),           { name: "quotes.json" });
    archive.append(toBuffer(deliveryNotes),    { name: "deliveryNotes.json" });
    archive.append(toBuffer(counters),         { name: "counters.json" });

    archive.finalize();
  });
}

// ── Main job ─────────────────────────────────────────────────────────────────
export function startWeeklyBackupJob() {
  const recipientEmail = process.env.BACKUP_EMAIL;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !recipientEmail) {
    console.warn(
      "⚠️  Daily backup job DISABLED — missing EMAIL_USER / EMAIL_PASS / BACKUP_EMAIL in .env"
    );
    return;
  }

  // Every day at 01:00 Jerusalem time
  cron.schedule(
    "0 1 * * *",
    async () => {
      console.log("🔄 Daily backup job started...");
      try {
        const users = await User.find({ isActive: true }).lean();

        const transporter = createTransporter();

        for (const user of users) {
          const zipBuffer = await generateBackupZip(user._id);
          const dateStr = new Date().toLocaleDateString("he-IL").replace(/\//g, "-");
          const filename = `גיבוי_מלא_${dateStr}.zip`;

          await transporter.sendMail({
            from: `"Yasmine Ledger" <${process.env.EMAIL_USER}>`,
            to: recipientEmail,
            subject: `📦 גיבוי יומי אוטומטי — ${dateStr}`,
            html: `
              <div dir="rtl" style="font-family:Arial,sans-serif;max-width:480px;margin:auto">
                <h2 style="color:#534AB7">גיבוי יומי אוטומטי ✅</h2>
                <p>שלום,</p>
                <p>מצורף הגיבוי השבועי האוטומטי של מערכת <strong>Yasmine Ledger</strong>.</p>
                <table style="border-collapse:collapse;width:100%;margin:16px 0">
                  <tr style="background:#f5f6fa">
                    <td style="padding:8px 12px;border:1px solid #e0e0e0;font-weight:bold">תאריך</td>
                    <td style="padding:8px 12px;border:1px solid #e0e0e0">${dateStr}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 12px;border:1px solid #e0e0e0;font-weight:bold">שם קובץ</td>
                    <td style="padding:8px 12px;border:1px solid #e0e0e0">${filename}</td>
                  </tr>
                  <tr style="background:#f5f6fa">
                    <td style="padding:8px 12px;border:1px solid #e0e0e0;font-weight:bold">גודל</td>
                    <td style="padding:8px 12px;border:1px solid #e0e0e0">${(zipBuffer.length / 1024).toFixed(1)} KB</td>
                  </tr>
                </table>
                <p style="color:#888;font-size:13px">
                  הגיבוי נשלח אוטומטית כל יום בשעה 01:00.<br/>
                  שמור את הקובץ במקום בטוח לשחזור עתידי.
                </p>
              </div>
            `,
            attachments: [
              {
                filename,
                content: zipBuffer,
                contentType: "application/zip",
              },
            ],
          });

          console.log(`✅ Daily backup sent to ${recipientEmail} (user: ${user.username})`);
        }
      } catch (err) {
        console.error("❌ Daily backup job failed:", err.message);
      }
    },
    { timezone: "Asia/Jerusalem" }
  );

  console.log("📅 Daily backup job scheduled — every day at 01:00 (Jerusalem)");
}
