const fs = require('fs');
let code = fs.readFileSync('src/components/AboutView.tsx', 'utf8');

const startIdx = code.indexOf('<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5');
if (startIdx === -1) {
  console.error('startIdx not found!');
  process.exit(1);
}

const endTag = '</div>\n        </section>';
const endIdx = code.indexOf(endTag, startIdx);
if (endIdx === -1) {
  console.error('endIdx not found!');
  process.exit(1);
}

const snippetToReplace = code.substring(startIdx, endIdx + '</div>'.length);

const replacement = `<div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 relative z-10">
            {schemesList.map((scheme, idx) => {
              const officialPortalUrl = schemesUrlMap.get(scheme);
              const marathiDigits = ['१', '२', '३', '४', '५', '६', '७', '८', '९', '१०'];
              const schemeNum = lang === 'mr' ? marathiDigits[idx] || (idx + 1) : (idx + 1);
              return (
                <div
                  key={scheme}
                  onClick={() => {
                    if (officialPortalUrl) {
                      window.open(officialPortalUrl, '_blank', 'noopener,noreferrer');
                    } else {
                      setCurrentRoute('schemes');
                    }
                  }}
                  title={officialPortalUrl ? (lang === 'mr' ? 'अधिकृत पोर्टल उघडा' : 'Open Official Portal') : undefined}
                  className="p-3.5 sm:p-4 rounded-xl bg-white/10 border border-white/15 text-xs sm:text-[13px] font-medium text-slate-100 flex items-center justify-between gap-3 hover:bg-white/20 hover:border-[#38BDF8]/40 transition-[background-color,border-color] duration-150 cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/30 flex items-center justify-center font-bold text-xs shrink-0">
                      {schemeNum}
                    </span>
                    <span className="leading-snug break-words font-medium">{scheme}</span>
                  </div>
                  {officialPortalUrl ? (
                    <span className="text-[11px] text-[#38BDF8] shrink-0 font-bold opacity-80 group-hover:opacity-100">↗</span>
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 group-hover:text-white" />
                  )}
                </div>
              );
            })}
          </div>`;

const updated = code.substring(0, startIdx) + replacement + code.substring(startIdx + snippetToReplace.length);
fs.writeFileSync('src/components/AboutView.tsx', updated, 'utf8');
console.log('Successfully updated schemes grid in AboutView.tsx');
