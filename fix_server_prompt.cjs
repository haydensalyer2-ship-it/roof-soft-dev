const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

// Replace the prompt to include the context
content = content.replace(
  'Analyze the provided images to identify vulnerabilities, highlight the urgency, and justify filing a claim.',
  'Analyze the provided images to identify vulnerabilities, highlight the urgency, and justify filing a claim.\\nHomeowner Context/Observations provided by inspector: ${context ? context : "None Provided"}'
);

fs.writeFileSync('server.ts', content);
