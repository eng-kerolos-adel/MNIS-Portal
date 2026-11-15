const fs = require('fs');
let code = fs.readFileSync('src/app/doctor/consultation/page.tsx', 'utf8');

code = code.replace(
  'onClick={addMedication}',
  'onClick={() => setMedModalOpen(true)}'
);

const UI_BLOCK = `
        {medModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader><CardTitle>{ar ? "إضافة دواء" : "Add Medication"}</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-3">
                <input className={input} placeholder={ar ? "اسم الدواء" : "Medication Name"} onChange={e => setNewMed({...newMed, nameEn: e.target.value})} />
                <input className={input} placeholder={ar ? "الجرعة (مثال 500mg)" : "Dose (e.g. 500mg)"} onChange={e => setNewMed({...newMed, dose: e.target.value})} />
                <input className={input} placeholder={ar ? "الشكل (أقراص، حقن)" : "Form (e.g. Tablet)"} onChange={e => setNewMed({...newMed, formEn: e.target.value})} />
                <input className={input} placeholder={ar ? "التكرار (كل 12 ساعة)" : "Frequency"} onChange={e => setNewMed({...newMed, freqEn: e.target.value})} />
                <div className="flex gap-2">
                  <input type="number" className={input} placeholder={ar ? "أيام" : "Days"} onChange={e => setNewMed({...newMed, days: +e.target.value})} />
                  <input type="number" className={input} placeholder={ar ? "كمية" : "Qty"} onChange={e => setNewMed({...newMed, qty: +e.target.value})} />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setMedModalOpen(false)}>{ar ? "إلغاء" : "Cancel"}</Button>
                  <Button onClick={addMedication} disabled={!newMed.nameEn}>{ar ? "إضافة" : "Add"}</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader><CardTitle>{ar ? "إحالة المريض" : "Patient Referral"}</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex gap-2">
              <select className={input} value={refTarget} onChange={e => setRefTarget(e.target.value)}>
                <option value="HOSPITAL">Hospital / ER</option>
                <option value="LAB">Laboratory</option>
                <option value="PHARMACY">Pharmacy</option>
              </select>
              <select className={input} value={refUrgency} onChange={e => setRefUrgency(e.target.value)}>
                <option value="ROUTINE">Routine</option>
                <option value="URGENT">Urgent</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <input className={input} placeholder={ar ? "سبب الإحالة" : "Reason for referral"} value={refReason} onChange={e => setRefReason(e.target.value)} />
            <Button onClick={createReferral} disabled={!refReason || busy}>{ar ? "إرسال إحالة" : "Send Referral"}</Button>
          </CardContent>
        </Card>
`;

const lines = code.split('\n');
const lastCardIndex = lines.findLastIndex(line => line.includes('</Card>'));
lines.splice(lastCardIndex + 1, 0, UI_BLOCK);

fs.writeFileSync('src/app/doctor/consultation/page.tsx', lines.join('\n'));
console.log('Done replacement');
