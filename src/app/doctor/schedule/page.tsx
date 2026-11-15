"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, Plus, Trash2 } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/lib/toast/ToastProvider";
import { useApiError } from "@/lib/api/useApiError";
import { api } from "@/lib/data/service";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

type Sched = any;
const field = "h-10 w-full rounded-lg bg-surface-container-low px-3 text-sm outline-none focus:ring-2 focus:ring-secondary/50";
const DAYS = [
  { val: 0, en: "Sunday", ar: "الأحد" },
  { val: 1, en: "Monday", ar: "الإثنين" },
  { val: 2, en: "Tuesday", ar: "الثلاثاء" },
  { val: 3, en: "Wednesday", ar: "الأربعاء" },
  { val: 4, en: "Thursday", ar: "الخميس" },
  { val: 5, en: "Friday", ar: "الجمعة" },
  { val: 6, en: "Saturday", ar: "السبت" },
];

export default function DoctorSchedulePage() {
  const { locale } = useLocale();
  const { push } = useToast();
  const handleError = useApiError();
  const ar = locale === "ar";
  
  const [items, setItems] = useState<Sched[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  
  const [dayOfWeek, setDayOfWeek] = useState(0);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [slotMinutes, setSlotMinutes] = useState(15);

  const load = useCallback(async () => {
    try {
      const res = await api.getMySchedule();
      setItems(res || []);
    } catch (e) { handleError(e); }
  }, [handleError]);
  useEffect(() => { void load(); }, [load]);

  async function addSlot() {
    setBusy(true);
    try {
      await api.upsertSchedule({ dayOfWeek, startTime, endTime, slotMinutes });
      push("success", ar ? "تم الحفظ" : "Saved", ar ? "تم إضافة الموعد لجدولك" : "Slot added to your schedule");
      setModalOpen(false);
      await load();
    } catch(e) { handleError(e); } finally { setBusy(false); }
  }

  async function removeSlot(id: string) {
    if (!confirm(ar ? "هل أنت متأكد من حذف هذا الموعد؟" : "Are you sure you want to delete this slot?")) return;
    setBusy(true);
    try {
      await api.deleteSchedule(id);
      push("success", ar ? "تم الحذف" : "Deleted");
      await load();
    } catch(e) { handleError(e); } finally { setBusy(false); }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader icon={CalendarClock} title={ar ? "جدول المواعيد" : "My Schedule"} />
      
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>{ar ? "أوقات العمل الأسبوعية" : "Weekly Availability"}</CardTitle>
          <Button size="sm" onClick={() => setModalOpen(true)} icon={<Plus className="h-4 w-4"/>}>{ar ? "إضافة فترة" : "Add Slot"}</Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {items.length === 0 && <p className="py-8 text-center text-sm text-on-surface-variant">{ar ? "لا يوجد أوقات عمل محددة بعد" : "No availability set yet"}</p>}
          {items.map((it) => (
            <div key={it.id} className="flex items-center justify-between p-4 rounded-lg border border-outline-variant/40 bg-surface">
              <div>
                <p className="font-bold text-on-surface">{DAYS.find(d => d.val === it.dayOfWeek)?.[ar ? 'ar' : 'en']}</p>
                <p className="text-sm text-on-surface-variant">{it.startTime} - {it.endTime} • {it.slotMinutes} {ar ? "دقيقة للمريض" : "min per patient"}</p>
              </div>
              <Button variant="outline" onClick={() => removeSlot(it.id)}><Trash2 className="h-4 w-4 text-error" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={ar ? "إضافة فترة عمل" : "Add Availability"}>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-semibold">{ar ? "يوم الأسبوع" : "Day of week"}
            <select className={field} value={dayOfWeek} onChange={e => setDayOfWeek(+e.target.value)}>
              {DAYS.map(d => <option key={d.val} value={d.val}>{ar ? d.ar : d.en}</option>)}
            </select>
          </label>
          <div className="flex gap-3">
            <label className="flex flex-col gap-1.5 text-sm font-semibold w-1/2">{ar ? "من الساعة" : "Start time"}
              <input type="time" className={field} value={startTime} onChange={e => setStartTime(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold w-1/2">{ar ? "إلى الساعة" : "End time"}
              <input type="time" className={field} value={endTime} onChange={e => setEndTime(e.target.value)} />
            </label>
          </div>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">{ar ? "مدة الكشف (بالدقائق)" : "Slot duration (minutes)"}
            <input type="number" className={field} value={slotMinutes} onChange={e => setSlotMinutes(+e.target.value)} />
          </label>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={busy}>{ar ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={addSlot} loading={busy}>{ar ? "حفظ" : "Save"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
