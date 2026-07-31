import { uid } from "../lib/core.js";

export const CAT = {
  legs: { label: "ขา", c: "#F5B417" },
  back: { label: "หลัง", c: "#4C9AE6" },
  chest: { label: "อก", c: "#EC6142" },
  arms: { label: "แขน", c: "#A88BEA" },
  shoulders: { label: "ไหล่", c: "#3FBF8F" },
  core: { label: "แกนกลาง", c: "#E0A93F" },
  rest: { label: "พัก", c: "#5B6470" },
};

const ex = (name, equip, cat, sets, lo, hi, weight, opt = {}) => ({
  id: uid(), name, equip, cat, sets, lo, hi, weight,
  perSide: !!opt.perSide, note: opt.note || "",
});
const rec = (name, detail) => ({ name, detail });

export function buildDefaultPlan() {
  const S = [];
  const push = (o) => S.push({ id: uid(), ...o });

  push({ day: 1, kind: "workout", title: "ขา + หลัง", cat: "legs", subtitle: "เปิดตัวหนัก",
    exercises: [
      ex("Smith Machine Squat", "Smith", "legs", 4, 6, 8, 60),
      ex("Romanian Deadlift", "Smith/Dumbbell", "legs", 4, 8, 10, 50),
      ex("Lat Pulldown", "Multi-gym", "back", 4, 8, 10, 45),
      ex("Seated Cable Row", "Multi-gym", "back", 3, 10, 12, 40),
      ex("Leg Extension", "Multi-gym", "legs", 3, 12, 15, 35),
    ], recovery: [] });

  push({ day: 2, kind: "rest", title: "พัก (Core ตามสะดวก)", cat: "rest", subtitle: "",
    exercises: [], recovery: [
      rec("เดินลู่วิ่งชัน / ว่ายน้ำเบา", "20 นาที"),
      rec("Plank", "3 เซ็ต × 45–60 วิ"),
      rec("Cable Woodchopper", "3 เซ็ต × 15/ข้าง"),
    ] });

  push({ day: 3, kind: "workout", title: "อก", cat: "chest", subtitle: "อกเต็มทุกองศา",
    exercises: [
      ex("Smith Bench Press (Flat)", "Smith", "chest", 4, 6, 8, 50),
      ex("Incline Dumbbell Press", "Dumbbell", "chest", 4, 8, 10, 20, { perSide: true }),
      ex("Chest Press Machine", "Multi-gym", "chest", 3, 10, 12, 40),
      ex("Dumbbell Flyes", "Dumbbell", "chest", 3, 12, 15, 10, { perSide: true }),
    ], recovery: [] });

  push({ day: 4, kind: "rest", title: "พักเต็มที่", cat: "rest", subtitle: "",
    exercises: [], recovery: [rec("Foam Roller / ว่ายน้ำผ่อนคลาย", "คลายกล้ามเนื้อ")] });

  push({ day: 5, kind: "workout", title: "แขน + ไหล่ข้าง", cat: "arms", subtitle: "หน้าแขน/หลังแขน/ไหล่",
    exercises: [
      ex("Dumbbell Bicep Curl", "Dumbbell", "arms", 4, 10, 12, 12, { perSide: true }),
      ex("Cable Tricep Pushdown", "Multi-gym", "arms", 4, 10, 12, 25),
      ex("Dumbbell Hammer Curl", "Dumbbell", "arms", 3, 10, 12, 12, { perSide: true }),
      ex("Cable Overhead Tricep Ext.", "Multi-gym", "arms", 3, 12, 12, 20),
      ex("Dumbbell Lateral Raise", "Dumbbell", "shoulders", 4, 12, 15, 8, { perSide: true }),
    ], recovery: [] });

  push({ day: 6, kind: "rest", title: "พัก (Core)", cat: "core", subtitle: "",
    exercises: [], recovery: [
      rec("Hanging Leg / Knee Raise", "3 เซ็ต × 12–15"),
      rec("Dumbbell Russian Twist", "3 เซ็ต × 20"),
      rec("เดินลู่วิ่งชันเบา", "15–20 นาที"),
    ] });

  push({ day: 7, kind: "rest", title: "พักเต็มที่", cat: "rest", subtitle: "",
    exercises: [], recovery: [rec("กินให้ครบ ~3,000 kcal", "ชาร์จพลังงานเข้าสัปดาห์ถัดไป")] });

  push({ day: 8, kind: "workout", title: "ขา (จัดเต็ม)", cat: "legs", subtitle: "เน้นขาทั้งเส้น",
    exercises: [
      ex("Smith Machine Squat", "Smith", "legs", 4, 8, 10, 55),
      ex("Dumbbell Walking Lunge", "Dumbbell", "legs", 3, 10, 10, 12, { perSide: true, note: "ต่อข้าง" }),
      ex("Leg Extension", "Multi-gym", "legs", 4, 12, 15, 35),
      ex("Dumbbell Stiff-Leg Deadlift", "Dumbbell", "legs", 4, 10, 12, 18, { perSide: true }),
      ex("Smith Calf Raise", "Smith", "legs", 4, 15, 15, 40),
    ], recovery: [] });

  push({ day: 9, kind: "rest", title: "พัก (Core ตามสะดวก)", cat: "rest", subtitle: "",
    exercises: [], recovery: [
      rec("ว่ายน้ำ", "20 นาที"),
      rec("Plank + Decline Sit-up", "3 เซ็ต × 15"),
    ] });

  push({ day: 10, kind: "workout", title: "หลัง + หน้าแขน", cat: "back", subtitle: "ดึงหลัง + ไบเซ็ป",
    exercises: [
      ex("Lat Pulldown (จับกว้าง)", "Multi-gym", "back", 4, 8, 10, 45),
      ex("One-Arm Dumbbell Row", "Dumbbell", "back", 4, 8, 10, 22, { perSide: true }),
      ex("Seated Cable Row (จับแคบ)", "Multi-gym", "back", 3, 10, 12, 40),
      ex("Incline Dumbbell Curl", "Dumbbell", "arms", 3, 10, 12, 10, { perSide: true }),
      ex("Cable Bicep Curl", "Multi-gym", "arms", 3, 12, 15, 20),
    ], recovery: [] });

  push({ day: 11, kind: "rest", title: "พัก (Core ตามสะดวก)", cat: "rest", subtitle: "",
    exercises: [], recovery: [
      rec("เดินลู่วิ่งชัน", "20 นาที"),
      rec("Woodchopper + Lying Leg Raise", "3 เซ็ต"),
    ] });

  push({ day: 12, kind: "workout", title: "อก + หลังแขน", cat: "chest", subtitle: "ดันอก + ไทรเซ็ป",
    exercises: [
      ex("Incline Smith Press", "Smith", "chest", 4, 8, 10, 45),
      ex("Flat Dumbbell Press", "Dumbbell", "chest", 4, 8, 10, 22, { perSide: true }),
      ex("Dumbbell Flyes", "Dumbbell", "chest", 3, 12, 12, 10, { perSide: true }),
      ex("Cable Tricep Pushdown", "Multi-gym", "arms", 4, 10, 12, 25),
      ex("Dumbbell Overhead Tricep Ext.", "Dumbbell", "arms", 3, 12, 12, 15, { perSide: true }),
    ], recovery: [] });

  push({ day: 13, kind: "rest", title: "พัก (Core)", cat: "core", subtitle: "",
    exercises: [], recovery: [
      rec("Plank", "3 เซ็ต × 60 วิ"),
      rec("Hanging Knee Raise", "3 เซ็ต × 15"),
      rec("ว่ายน้ำผ่อนคลาย", "15–20 นาที"),
    ] });

  push({ day: 14, kind: "rest", title: "พักเต็มที่ — จบรอบ", cat: "rest", subtitle: "",
    exercises: [], recovery: [rec("พักผ่อน พร้อมเริ่ม Day 1 ใหม่", "รอบถัดไปให้ AI เจนแผนใหม่ได้เลย")] });

  return { version: 2, unit: "kg", sessions: S };
}
