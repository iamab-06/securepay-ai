const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'pages', 'admin');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

const replacements = [
  { search: /text-white\/50/g, replace: 'text-slate-500' },
  { search: /text-white\/40/g, replace: 'text-slate-400' },
  { search: /text-white\/30/g, replace: 'text-slate-400' },
  { search: /text-white/g, replace: 'text-slate-900' },
  { search: /bg-\[#121216\]/g, replace: 'bg-white' },
  { search: /border-white\/10/g, replace: 'border-slate-200' },
  { search: /border-white\/5/g, replace: 'border-slate-200' },
  { search: /bg-white\/5/g, replace: 'bg-slate-50' },
  { search: /hover:bg-white\/\[0\.02\]/g, replace: 'hover:bg-slate-50' }
];

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  replacements.forEach(r => {
    content = content.replace(r.search, r.replace);
  });
  
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
});
