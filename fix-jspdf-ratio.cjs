const fs = require('fs');
let content = fs.readFileSync('src/views/ReportGenerator.tsx', 'utf8');

content = content.replace(
  /const imgData = canvas\.toDataURL\('image\/jpeg', 1\.0\);\n[\s\S]*?pdf\.save/,
  `const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      const pdfWidth = 816;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      const pdf = new jsPDF({
        unit: 'px',
        format: [pdfWidth, pdfHeight],
        orientation: 'portrait'
      });
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save`
);

fs.writeFileSync('src/views/ReportGenerator.tsx', content);
