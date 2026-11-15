const fs = require('fs');
let code = fs.readFileSync('src/app/reception/citizens/page.tsx', 'utf8');

const GOVS = `
const GOVERNORATES = [
  { ar: 'القاهرة', en: 'Cairo', cities: [{ ar: 'مدينة نصر', en: 'Nasr City' }, { ar: 'مصر الجديدة', en: 'Heliopolis' }, { ar: 'المعادي', en: 'Maadi' }, { ar: 'شبرا', en: 'Shoubra' }, { ar: 'التجمع الخامس', en: 'New Cairo' }] },
  { ar: 'الجيزة', en: 'Giza', cities: [{ ar: 'الدقي', en: 'Dokki' }, { ar: 'المهندسين', en: 'Mohandeseen' }, { ar: 'الهرم', en: 'Haram' }, { ar: 'الشيخ زايد', en: 'Sheikh Zayed' }, { ar: 'أكتوبر', en: '6th of October' }] },
  { ar: 'الإسكندرية', en: 'Alexandria', cities: [{ ar: 'سموحة', en: 'Smouha' }, { ar: 'سيدي بشر', en: 'Sidi Beshr' }, { ar: 'المنتزه', en: 'Montaza' }, { ar: 'محرم بك', en: 'Moharam Bek' }, { ar: 'برج العرب', en: 'Borg El Arab' }] },
  { ar: 'بورسعيد', en: 'Port Said', cities: [{ ar: 'بورفؤاد', en: 'Port Fouad' }, { ar: 'الشرق', en: 'Al-Sharq' }, { ar: 'الزهور', en: 'Al-Zohour' }] },
  { ar: 'الإسماعيلية', en: 'Ismailia', cities: [{ ar: 'الإسماعيلية', en: 'Ismailia' }, { ar: 'فايد', en: 'Fayed' }, { ar: 'القنطرة', en: 'Qantara' }] },
  { ar: 'الأقصر', en: 'Luxor', cities: [{ ar: 'الأقصر', en: 'Luxor' }, { ar: 'إسنا', en: 'Esna' }, { ar: 'أرمنت', en: 'Armant' }] },
  { ar: 'أسوان', en: 'Aswan', cities: [{ ar: 'أسوان', en: 'Aswan' }, { ar: 'إدفو', en: 'Edfu' }, { ar: 'كوم أمبو', en: 'Kom Ombo' }] }
];
`;

code = code.replace(
  'const BLOOD = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];',
  'const BLOOD = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];\n' + GOVS
);

const NEW_FIELDS = `            <label className="flex flex-col gap-1.5 text-sm font-semibold">{ar ? "المحافظة" : "Governorate"}
              <select className={field} value={f.governorate} onChange={(e) => set("governorate", e.target.value)}>
                <option value="">{ar ? "-- اختر --" : "-- Select --"}</option>
                {GOVERNORATES.map(g => <option key={g.en} value={g.en}>{ar ? g.ar : g.en}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">{ar ? "المركز/المدينة" : "City/District"}
              <select className={field} value={f.district} onChange={(e) => set("district", e.target.value)} disabled={!f.governorate}>
                <option value="">{ar ? "-- اختر --" : "-- Select --"}</option>
                {GOVERNORATES.find(g => g.en === f.governorate)?.cities.map(c => <option key={c.en} value={c.en}>{ar ? c.ar : c.en}</option>)}
              </select>
            </label>`;

code = code.replace(
  /<label className="flex flex-col gap-1\.5 text-sm font-semibold">\{ar \? "المحافظة" : "Governorate"\}[\s\S]*?<\/label>\s*<label className="flex flex-col gap-1\.5 text-sm font-semibold">\{ar \? "المركز\/المدينة" : "City\/District"\}[\s\S]*?<\/label>/,
  NEW_FIELDS
);

fs.writeFileSync('src/app/reception/citizens/page.tsx', code);
console.log('Done Update Govs');
