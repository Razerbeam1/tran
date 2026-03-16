# 🌐 LINE Bot แปลภาษา พม่า-ไทย-อังกฤษ

Bot แปลภาษาอัตโนมัติ 3 ภาษา: พม่า ↔ ไทย ↔ อังกฤษ
ใช้ฟรีทั้งหมด ไม่มีค่าใช้จ่าย!

## 🛠 Tech Stack (ฟรีทั้งหมด)
- LINE Messaging API (ฟรี)
- Google Translate (unofficial - ฟรี)
- Render.com (Free tier)
- Cron-job.org (Keep-alive ฟรี)

## 📦 วิธี Deploy

### 1. Push ขึ้น GitHub
```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/line-translate-bot.git
git push -u origin main
```

### 2. Deploy บน Render.com
1. ไปที่ https://render.com → Sign up ฟรี
2. New → Web Service → เชื่อม GitHub repo
3. ตั้งค่า:
   - Name: `line-translate-bot`
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
4. เพิ่ม Environment Variables:
   - `CHANNEL_ACCESS_TOKEN` = (จาก LINE Developers)
   - `CHANNEL_SECRET` = (จาก LINE Developers)
5. กด Deploy!

### 3. ตั้ง Webhook URL ใน LINE
- URL: `https://line-translate-bot.onrender.com/callback`
- เปิด "Use webhook" ✅
- ปิด "Auto-reply messages" ❌

### 4. ตั้ง Keep-alive (Cron-job.org)
1. ไปที่ https://cron-job.org → สมัครฟรี
2. Create Cron Job:
   - URL: `https://line-translate-bot.onrender.com/health`
   - Schedule: Every 10 minutes
3. Save & Enable

## 💬 วิธีใช้
พิมพ์ข้อความภาษาอะไรก็ได้ Bot จะแปลให้อัตโนมัติ!
- 🇲🇲 พม่า → แปลเป็นไทย + อังกฤษ
- 🇹🇭 ไทย → แปลเป็นพม่า + อังกฤษ  
- 🇬🇧 อังกฤษ → แปลเป็นพม่า + ไทย
