# 🏋️ Iron Log v2 — React (Vite + Tailwind)

Workout Tracker แบบ client-side ลื่น 60fps: ตารางฝึก 14 วันที่ **เลื่อนอัตโนมัติ**,
บันทึกรายเซ็ต + **Rest Timer** (เสียง/สั่น/กันจอดับ), **AI เจนแผน Phase 2** เมื่อครบ 14 วัน,
ซิงก์ **Google Sheets** ผ่าน Apps Script พร้อม **LocalStorage cache** ใช้ได้แม้เน็ตหลุด

```bash
npm install
npm run dev      # รันในเครื่อง (ยังไม่ต้องตั้งค่าอะไร ใช้ localStorage ล้วน)
npm run build    # ได้โฟลเดอร์ dist/ สำหรับ deploy
```

## โครงไฟล์
```
src/
├─ App.jsx                     # ประกอบทุกส่วน: แท็บ, timer, wake lock, AI flow, cycle-complete
├─ components/
│  ├─ TodayTab / PlanTab / HistoryTab / ToolsTab
│  ├─ ExerciseCard.jsx         # บันทึกรายเซ็ต (กดเสร็จ = เริ่ม Rest Timer)
│  ├─ RestTimerBar.jsx         # แถบนับถอยหลัง + ปุ่ม +30/-30/Skip
│  └─ AiPreviewModal.jsx       # พรีวิวแผนใหม่เทียบของเดิม + ปุ่ม Confirm & Apply
├─ hooks/  useRestTimer · useWakeLock · useAppData
├─ services/
│  ├─ aiGenerator.js           # ส่งประวัติ → AI → รับ JSON แผน 14 วัน (Gemini/Claude)
│  └─ googleSheet.js           # ต่อ Apps Script + คิว sync ออฟไลน์
├─ lib/  core.js (ตรรกะล้วน) · storage.js (localStorage)
└─ data/ defaultPlan.js
google-apps-script.gs           # โค้ดไปวางใน Google Sheets
```

---

## 1) ต่อ Google Sheets (ซิงก์หลายเครื่อง)
1. สร้าง Google Sheet เปล่า 1 อัน
2. **Extensions → Apps Script** → ลบของเดิม วางเนื้อหา `google-apps-script.gs` ทั้งไฟล์
3. **Deploy → New deployment → Type: Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - กด Deploy แล้ว **Authorize** (อนุญาตให้สคริปต์เข้าถึงชีต)
4. ก็อป **Web app URL** (ลงท้าย `/exec`)
5. เปิดแอป → แท็บ **เครื่องมือ** → วาง URL ในช่อง *Apps Script Web App URL* → กด **ดึงข้อมูลจากชีต**

> แท็บ `kv` และ `logs` ในชีตจะถูกสร้างให้อัตโนมัติครั้งแรกที่บันทึก
> ทุกครั้งที่บันทึก แอปจะเซฟลง localStorage ทันที แล้วค่อยดันขึ้นชีตเป็น background (ถ้าเน็ตหลุดจะเข้าคิวไว้ แล้วซิงก์ให้เองเมื่อกลับมาออนไลน์)

## 2) ใส่ AI API Key (เจนแผน Phase 2)
**แนะนำ Gemini** (เรียกจากเบราว์เซอร์ได้ตรง ๆ):
1. ไป **Google AI Studio → Get API key** (ฟรี)
2. เปิดแอป → แท็บ **เครื่องมือ** → เลือก **Gemini** → วาง API Key
3. เมื่อครบ 14 วัน จะมีแบนเนอร์ให้กด **“ให้ AI เจนแผน Phase 2”** (หรือกดเองได้ที่แท็บ **แผน**)
4. ระบบจะโชว์หน้าต่างพรีวิวเทียบแผนเดิม → กด **Confirm & Apply** เพื่อเขียนทับแผน (และซิงก์ขึ้นชีต)

> **Claude:** เลือกได้ในหน้าเครื่องมือ แต่ Anthropic บล็อก CORS จากเบราว์เซอร์
> โค้ดตั้ง header `anthropic-dangerous-direct-browser-access` ให้แล้ว แต่ทางที่ปลอดภัยกว่าคือ proxy ผ่าน Apps Script (เก็บคีย์ฝั่งเซิร์ฟเวอร์)

> ⚠️ **ความปลอดภัยของคีย์:** โหมด client-side จะเก็บ API key ไว้ใน localStorage ของเครื่อง —
> ใช้บนอุปกรณ์ส่วนตัวเท่านั้น ถ้าต้องการซ่อนคีย์ ให้ย้ายการเรียก AI ไปไว้ใน Apps Script แล้วเก็บคีย์ใน Script Properties

## 3) Deploy (Vercel / Netlify)
- push โปรเจกต์นี้ขึ้น GitHub
- **Vercel:** New Project → เลือก repo → Framework: **Vite** → Deploy (ตั้งค่า default พอ)
- **Netlify:** Build command `npm run build`, Publish directory `dist`
- เปิดลิงก์บนมือถือ → เมนูเบราว์เซอร์ → **เพิ่มลงในหน้าจอโฮม** ได้ไอคอนกดเข้าเหมือนแอป
- ตั้งค่า Apps Script URL + AI Key ในแต่ละเครื่องครั้งเดียว (ข้อมูลฝึกซิงก์ผ่านชีตอยู่แล้ว)

---

## ฟีเจอร์ตามสเปก
- **Rest Timer:** เริ่มอัตโนมัติเมื่อติ๊กเสร็จเซ็ต, นับสด (requestAnimationFrame), ปุ่ม +30/-30/Skip, Web Audio beep + `navigator.vibrate`, Wake Lock กันจอดับระหว่างซ้อม (ตั้งเวลาเริ่มต้นได้ในเครื่องมือ)
- **14-Day Cycle + AI:** pointer 0→13 + ปุ่ม “ไม่ได้ออก”, ครบ 14 วันเด้งแจ้งเตือน, ดึงประวัติจริง (น้ำหนัก/เร็พ/1RM) ยิงเข้า AI → พรีวิว → Confirm & Apply
- **4 แท็บ:** วันนี้ / แผน / ประวัติ (กราฟ 1RM) / เครื่องมือ & Settings
- **Google Sheets:** `kv` (plan+state เป็น JSON), `logs` (รายเซ็ต)

## หมายเหตุ
- น้ำหนักเริ่มต้นเป็นค่าประมาณ ปรับให้ตรงกับที่ยกได้จริงในแท็บ ‘แผน’
- ปุ่ม “ปรับน้ำหนักอัตโนมัติ” (แท็บเครื่องมือ) ทำ Progressive Overload ในเครื่องได้โดยไม่ต้องใช้ AI
