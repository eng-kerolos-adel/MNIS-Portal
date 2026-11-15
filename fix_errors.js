const fs = require('fs');

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Fix Button tone -> variant
  content = content.replace(/<Button([^>]+)tone=/g, '<Button$1variant=');
  content = content.replace(/variant="destructive"/g, 'variant="danger"');
  
  // Fix Button size="icon" -> className="h-8 w-8 p-0"
  content = content.replace(/size="icon"/g, 'className="h-8 w-8 p-0"');

  // Fix Badge tone="info" -> tone="secondary"
  content = content.replace(/tone="info"/g, 'tone="secondary"');
  // Fix Badge tone="destructive" -> tone="error"
  content = content.replace(/tone="destructive"/g, 'tone="error"');

  // Fix PageHeader action= -> actions=
  content = content.replace(/action={/g, 'actions={');

  // Fix toast push calls
  if (content.includes('toast({')) {
    content = content.replace(/toast\(\{\s*title:\s*(.+),\s*description:\s*(.+),\s*type:\s*(["']success["']|["']error["']|["']warning["']|["']info["'])\s*\}\)/g, (match, title, desc, type) => {
      let k = type.replace(/['"]/g, '');
      return `toast("${k}", ${title}, ${desc})`;
    });
  }

  // Add Badge import to chronic-allowances
  if (file.includes('chronic-allowances') && !content.includes('import { Badge }')) {
    content = content.replace('import { Button } from "@/components/ui/Button";', 'import { Button } from "@/components/ui/Button";\nimport { Badge } from "@/components/ui/Badge";');
  }

  // Fix SearchInput onChange in chronic-allowances
  if (file.includes('chronic-allowances')) {
    content = content.replace('onChange={(e) => setSearchQuery(e.target.value)}', 'onChange={setSearchQuery}');
  }

  // Fix radiology file null
  if (file.includes('radiology')) {
    content = content.replace('setFile(e.target.files?.[0])', 'setFile(e.target.files?.[0] || null)');
  }

  fs.writeFileSync(file, content);
}

const files = [
  "src/app/doctor/queue/page.tsx",
  "src/app/doctor/referrals/page.tsx",
  "src/app/doctor/schedule/page.tsx",
  "src/app/hospital/blood-bank/page.tsx",
  "src/app/hospital/er-triage/page.tsx",
  "src/app/hospital/surgical/page.tsx",
  "src/app/lab/qc-calibration/page.tsx",
  "src/app/lab/radiology/page.tsx",
  "src/app/lab/reagents/page.tsx",
  "src/app/lab/sample-intake/page.tsx",
  "src/app/pharmacy/chronic-allowances/page.tsx",
  "src/app/pharmacy/financial-settlement/page.tsx",
  "src/app/pharmacy/insurance-claims/page.tsx",
  "src/app/pharmacy/rx-verification/page.tsx",
  "src/app/reception/appointments/page.tsx"
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    fixFile(f);
  }
});
console.log("Fixed again!");
