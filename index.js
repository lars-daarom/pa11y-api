const express = require('express');
const pa11y = require('pa11y');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Info endpoint voor browsergebruik
app.get('/', (req, res) => {
  res.send('✅ Pa11y API is online. Gebruik POST /scan met JSON { "url": "..." }');
});

app.post('/scan', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "Missing 'url' parameter." });
  }

  try {
    const result = await pa11y(url, {
      standard: 'WCAG2AA',
      timeout: 120000,
      chromeLaunchConfig: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    });

    const issues = result.issues.map(issue => ({
      code: issue.code,
      message: issue.message,
      context: issue.context,
      selector: issue.selector,
      type: issue.type
    }));

    res.json({
      url,
      issues,
      issueCount: issues.length
    });

  } catch (error) {
    res.status(500).json({
      error: 'Scan failed',
      message: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Pa11y API running on port ${PORT}`);
});
