const fs = require('fs');

let content = fs.readFileSync('src/views/ReportGenerator.tsx', 'utf8');

// Replace handleGenerateSummary
const oldHandler = `  const handleGenerateSummary = async () => {
    if (!reportInfo && !damageReport) {
      setError("Please enter observations or select a damaged lead first.");
      return;
    }
    setIsGeneratingSummary(true);
    setError(null);
    try {
      const hailHits = damageReport?.testSquares?.reduce((sum, ts) => sum + (ts.hailHits || 0), 0) || 0;
      const windHits = damageReport?.testSquares?.reduce((sum, ts) => sum + (ts.windDamagedShingles || 0), 0) || 0;

      const res = await fetch("/api/generate-insurance-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          damageDescription: reportInfo,
          roofAge: damageReport?.roofAgeEstimate,
          roofType: damageReport?.roofType,
          hailHits,
          windHits,
          collateral: damageReport?.collateralDamage
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setRecommendation(data.summary);
    } catch (err: any) {
      setError(err.message || 'Failed to generate summary');
    } finally {
      setIsGeneratingSummary(false);
    }
  };`;

const newHandler = `  const handleGenerateSummary = async () => {
    if (!reportInfo && overviewPhotos.length === 0 && damagePhotos.length === 0) {
      setError("Please add observations or upload photos before auto-writing.");
      return;
    }
    
    setIsGeneratingSummary(true);
    setError(null);
    
    try {
      const allPhotos = [];
      if (coverPhoto) allPhotos.push(coverPhoto);
      allPhotos.push(...overviewPhotos);
      allPhotos.push(...damagePhotos);
      
      // Take up to 5 photos to not overload payload
      const formattedImages = allPhotos.slice(0, 5).map(dataUrl => {
        const parts = dataUrl.split(';');
        const mimeType = parts[0].split(':')[1];
        const data = parts[1].split(',')[1];
        return {
          inlineData: { data, mimeType }
        };
      });

      const res = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          images: formattedImages,
          context: reportInfo
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      try {
        const text = data.result.replace(/^\\s*\`\`\`json\\n?/, '').replace(/\\n?\`\`\`\\s*$/, '').trim();
        const resultObj = JSON.parse(text);
        if (resultObj.damageSummary) setReportInfo(resultObj.damageSummary);
        if (resultObj.recommendation) setRecommendation(resultObj.recommendation);
      } catch (e) {
        // Fallback if not parsable JSON
        setRecommendation(data.result);
      }
      
    } catch (err: any) {
      setError(err.message || 'Failed to generate summary');
    } finally {
      setIsGeneratingSummary(false);
    }
  };`;

content = content.replace(oldHandler, newHandler);

// Disable Auto-generate check
content = content.replace(
  'disabled={isGeneratingSummary || (!reportInfo && !damageReport)}',
  'disabled={isGeneratingSummary || (overviewPhotos.length === 0 && damagePhotos.length === 0 && !reportInfo)}'
);

fs.writeFileSync('src/views/ReportGenerator.tsx', content);
