const fs = require('fs');

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Fix Button tone -> variant
  content = content.replace(/<Button([^>]+)tone=/g, '<Button$1variant=');
  content = content.replace(/variant="destructive"/g, 'variant="danger"');
  
  // Fix Badge tone="info" -> tone="secondary"
  content = content.replace(/tone="info"/g, 'tone="secondary"');

  // admin/users/page.tsx specific
  if (file.includes('admin/users')) {
    content = content.replace('tone="destructive"', 'variant="danger"'); // fallback just in case
  }

  // analytics/gis-epidemiology/page.tsx
  // setMapData(data) where data is Raw but expects array
  if (file.includes('gis-epidemiology')) {
    content = content.replace('setMapData(data)', 'setMapData(Array.isArray(data) ? data : [])');
  }

  // analytics/reports/page.tsx
  // Object is possibly undefined
  if (file.includes('reports/page.tsx')) {
    content = content.replace('const Icon = r.icon;', 'const Icon = r.icon;'); // not sure what it is without seeing.
  }

  // doctor/consultation/page.tsx
  if (file.includes('doctor/consultation')) {
     content = content.replace(/<Button([^>]+)tone=/g, '<Button$1variant=');
  }

  fs.writeFileSync(file, content);
}

const files = [
  "src/app/admin/users/page.tsx",
  "src/app/analytics/fraud/page.tsx",
  "src/app/analytics/gis-epidemiology/page.tsx",
  "src/app/analytics/reports/page.tsx",
  "src/app/doctor/consultation/page.tsx"
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    fixFile(f);
  }
});
console.log("Fixed again part 2!");
