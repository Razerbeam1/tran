// ===================================================
// LINE Bot แปลภาษา พม่า ↔ ไทย ↔ อังกฤษ ↔ เกาหลี
// Host ฟรีบน Render.com
// ===================================================

const express = require("express");
const line = require("@line/bot-sdk");
const translate = require("translate-google");

// ─── Config ────────────────────────────────────────
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken,
});

const app = express();

// ─── Keep-alive endpoint (สำหรับ cron ping) ───────
app.get("/", (req, res) => {
  res.send("🟢 Translate Bot is alive!");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// ─── Webhook endpoint ──────────────────────────────
app.post("/callback", line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error("Webhook error:", err);
      res.status(500).end();
    });
});

// ─── ตรวจจับภาษา (แบบง่าย ไม่ต้องใช้ API) ────────
function detectLanguage(text) {
  // Myanmar Unicode range: U+1000 - U+109F
  const myanmarRegex = /[\u1000-\u109F]/;
  // Thai Unicode range: U+0E00 - U+0E7F
  const thaiRegex = /[\u0E00-\u0E7F]/;
  // Korean (Hangul) Unicode ranges: U+AC00-U+D7AF (syllables), U+1100-U+11FF (Jamo), U+3130-U+318F (compat Jamo)
  const koreanRegex = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/;

  if (myanmarRegex.test(text)) return "my";   // Myanmar/Burmese
  if (thaiRegex.test(text)) return "th";       // Thai
  if (koreanRegex.test(text)) return "ko";     // Korean
  return "en";                                  // Default = English
}

// ─── ชื่อภาษาสำหรับแสดงผล ──────────────────────────
const langNames = {
  my: { th: "พม่า", en: "Burmese", my: "ဗမာ", ko: "미얀마어" },
  th: { th: "ไทย", en: "Thai", my: "ထိုင်း", ko: "태국어" },
  en: { th: "อังกฤษ", en: "English", my: "အင်္ဂလိပ်", ko: "영어" },
  ko: { th: "เกาหลี", en: "Korean", my: "ကိုရီးယား", ko: "한국어" },
};

// ─── แปลภาษา ───────────────────────────────────────
async function translateText(text, fromLang) {
  const results = [];

  // กำหนดภาษาเป้าหมาย (แปลไปอีก 3 ภาษา)
  const targets = ["my", "th", "en", "ko"].filter((l) => l !== fromLang);

  for (const targetLang of targets) {
    try {
      const translated = await translate(text, {
        from: fromLang,
        to: targetLang,
      });
      results.push({
        lang: targetLang,
        text: translated,
      });
    } catch (err) {
      console.error(`Translation error (${fromLang} → ${targetLang}):`, err.message);
      results.push({
        lang: targetLang,
        text: "❌ แปลไม่ได้ / Translation failed",
      });
    }
  }

  return results;
}

// ─── สร้างข้อความตอบกลับ ───────────────────────────
function buildReplyMessage(fromLang, translations) {
  const lines = [];

  for (const t of translations) {
    const flag =
      t.lang === "my" ? "🇲🇲" :
      t.lang === "th" ? "🇹🇭" :
      t.lang === "ko" ? "🇰🇷" :
      "🇬🇧";
    lines.push(`${flag} : ${t.text}`);
  }

  return lines.join("\n");
}

// ─── จัดการ Event ──────────────────────────────────
async function handleEvent(event) {
  // รับเฉพาะข้อความ text เท่านั้น
  if (event.type !== "message" || event.message.type !== "text") {
    return Promise.resolve(null);
  }

  const userText = event.message.text.trim();

  // ถ้าพิมพ์ /help หรือ วิธีใช้
  if (userText === "/help" || userText === "วิธีใช้" || userText === "help") {
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [
        {
          type: "text",
          text:
            "📖 วิธีใช้ Bot แปลภาษา\n" +
            "━━━━━━━━━━━━━━━\n\n" +
            "พิมพ์ข้อความภาษาอะไรก็ได้:\n\n" +
            "🇲🇲 พม่า → แปลเป็นไทย + อังกฤษ + เกาหลี\n" +
            "🇹🇭 ไทย → แปลเป็นพม่า + อังกฤษ + เกาหลี\n" +
            "🇬🇧 อังกฤษ → แปลเป็นพม่า + ไทย + เกาหลี\n" +
            "🇰🇷 เกาหลี → แปลเป็นพม่า + ไทย + อังกฤษ\n\n" +
            "ตัวอย่าง:\n" +
            '• พิมพ์ "สวัสดีครับ"\n' +
            '• พิมพ์ "Hello"\n' +
            '• พิมพ์ "မင်္ဂလာပါ"\n' +
            '• พิมพ์ "안녕하세요"\n\n' +
            "Bot จะแปลให้อัตโนมัติ! 🚀",
        },
      ],
    });
  }

  try {
    // 1) ตรวจจับภาษา
    const detectedLang = detectLanguage(userText);

    // 2) แปลไปภาษาอื่น
    const translations = await translateText(userText, detectedLang);

    // 3) สร้างข้อความตอบกลับ
    const replyText = buildReplyMessage(detectedLang, translations);

    // 4) ส่งกลับ
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [{ type: "text", text: replyText }],
    });
  } catch (err) {
    console.error("handleEvent error:", err);
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [
        {
          type: "text",
          text: "❌ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
        },
      ],
    });
  }
}

// ─── Start Server ──────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Bot is running on port ${PORT}`);
  console.log(`📡 Webhook URL: https://YOUR-APP.onrender.com/callback`);
});
