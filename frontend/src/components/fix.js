const fs = require('fs');
const files = ['AdminDashboard.jsx', 'AdminUserManagement.jsx', 'FacultyAdvisorManagement.jsx', 'ReportsAnalytics.jsx', 'SystemConfiguration.jsx'];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  // Match the long hardcoded sidebar class
  let newContent = content.replace(/className=\{`w-\[260px\] flex flex-col shrink-0 h-screen sticky top-0 px-4 pt-7 pb-5 transition-transform duration-300 ease-in-out md:translate-x-0 \$\{\n?\s*isMobileMenuOpen \? 'translate-x-0' : '-translate-x-full'\n?\s*\} md:relative md:block fixed inset-y-0 left-0 z-50`\}/g,
    "className={`admin-sidebar w-[260px] flex flex-col shrink-0 h-screen sticky top-0 px-4 pt-7 pb-5 z-50 ${isMobileMenuOpen ? 'open' : ''}`}");
  fs.writeFileSync(f, newContent);
});

let userMgmt = fs.readFileSync('AdminUserManagement.jsx', 'utf8');
userMgmt = userMgmt.replace(/className="overflow-hidden rounded-\[10px\]"/g, 'className="overflow-x-auto rounded-[10px]"');
fs.writeFileSync('AdminUserManagement.jsx', userMgmt);

let indexCss = fs.readFileSync('../index.css', 'utf8');
if (!indexCss.includes('.admin-sidebar')) {
    indexCss += `

/* Admin Mobile Overrides */
@media (max-width: 768px) {
  .admin-sidebar {
    position: fixed !important;
    left: 0;
    top: 0;
    bottom: 0;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    display: flex !important;
  }
  .admin-sidebar.open {
    transform: translateX(0);
  }
}

@media (max-width: 480px) {
  main h1[class*="text-[#111827]"], 
  main h4[class*="text-[#111827]"],
  .admin-spotlight-surface h1, 
  .admin-spotlight-surface h4 {
    font-size: 1.45rem !important;
    line-height: 1.2 !important;
  }
}
`;
    fs.writeFileSync('../index.css', indexCss);
}

console.log('Update completed successfully.');
