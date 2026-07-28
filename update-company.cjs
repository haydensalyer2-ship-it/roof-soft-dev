const fs = require('fs');

// 1. App.tsx
let app = fs.readFileSync('src/App.tsx', 'utf8');

app = app.replace(
  "const [companyWebsite, setCompanyWebsite] = useState(() => localStorage.getItem('companyWebsite') || 'www.rafter.ai');",
  "const [companyWebsite, setCompanyWebsite] = useState(() => localStorage.getItem('companyWebsite') || 'www.rafter.ai');\n  const [companyPhone, setCompanyPhone] = useState(() => localStorage.getItem('companyPhone') || '1-800-555-0199');\n  const [companyAddress, setCompanyAddress] = useState(() => localStorage.getItem('companyAddress') || '123 Headquarters Road, Suite 100, Cityville, State 12345');"
);

app = app.replace(
  "localStorage.setItem('companyWebsite', companyWebsite);",
  "localStorage.setItem('companyWebsite', companyWebsite);\n    localStorage.setItem('companyPhone', companyPhone);\n    localStorage.setItem('companyAddress', companyAddress);"
);

app = app.replace(
  /\[companyName, companyWebsite\]\);/,
  "[companyName, companyWebsite, companyPhone, companyAddress]);"
);

// We need to account for second occurrence (one in ReportGenerator, one in Settings)
app = app.replace(
  "companyWebsite={companyWebsite}\n          logoImage={logoImage}",
  "companyWebsite={companyWebsite}\n          companyPhone={companyPhone}\n          companyAddress={companyAddress}\n          logoImage={logoImage}"
);

app = app.replace(
  "companyWebsite={companyWebsite}\n          setCompanyWebsite={setCompanyWebsite}",
  "companyWebsite={companyWebsite}\n          setCompanyWebsite={setCompanyWebsite}\n          companyPhone={companyPhone}\n          setCompanyPhone={setCompanyPhone}\n          companyAddress={companyAddress}\n          setCompanyAddress={setCompanyAddress}"
);

fs.writeFileSync('src/App.tsx', app);


// 2. Settings.tsx
let settings = fs.readFileSync('src/views/Settings.tsx', 'utf8');

// Update Interface
settings = settings.replace(
  "setCompanyWebsite: (url: string) => void;",
  "setCompanyWebsite: (url: string) => void;\n  companyPhone: string;\n  setCompanyPhone: (phone: string) => void;\n  companyAddress: string;\n  setCompanyAddress: (address: string) => void;"
);

// Update Component props
settings = settings.replace(
  "companyWebsite, setCompanyWebsite, logoImage,",
  "companyWebsite, setCompanyWebsite, companyPhone, setCompanyPhone, companyAddress, setCompanyAddress, logoImage,"
);

// Add fields to UI
let fieldsToAdd = `
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#a3a3a3] mb-1.5">Company Phone</label>
                    <input 
                      type="text" 
                      value={companyPhone}
                      onChange={(e) => setCompanyPhone(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-white text-[13px] focus:outline-none focus:border-white focus:ring-1 focus:ring-[#ffffff] transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#a3a3a3] mb-1.5">Company Address</label>
                    <input 
                      type="text" 
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-white text-[13px] focus:outline-none focus:border-white focus:ring-1 focus:ring-[#ffffff] transition-colors" 
                    />
                  </div>
`;

settings = settings.replace(
  `<label className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#a3a3a3] mb-1.5">Company Website / Phone</label>`,
  `<label className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#a3a3a3] mb-1.5">Company Website</label>`
);

settings = settings.replace(
  /<\/div>\s*<\/div>\s*<div className="mt-6 flex justify-end">/,
  `</div>\n${fieldsToAdd}\n                </div>\n\n                <div className="mt-6 flex justify-end">`
);

fs.writeFileSync('src/views/Settings.tsx', settings);


// 3. ReportGenerator.tsx
let report = fs.readFileSync('src/views/ReportGenerator.tsx', 'utf8');

report = report.replace(
  "companyWebsite: string;",
  "companyWebsite: string;\n  companyPhone: string;\n  companyAddress: string;"
);

report = report.replace(
  "project, projects = [], onNavigate, companyName, companyWebsite, logoImage,",
  "project, projects = [], onNavigate, companyName, companyWebsite, companyPhone, companyAddress, logoImage,"
);

report = report.replace(
  `             <div>123 Headquarters Road, Suite 100</div>\n             <div>Cityville, State 12345</div>\n             <div className="pt-1">{repPhone || '1-800-555-0199'}</div>`,
  `             <div className="whitespace-pre-wrap">{companyAddress}</div>\n             <div className="pt-1">{companyPhone}</div>`
);

fs.writeFileSync('src/views/ReportGenerator.tsx', report);
