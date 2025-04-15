const express = require('express');
const pa11y = require('pa11y');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Info endpoint voor de browser
app.get('/', (req, res) => {
  res.send('✅ Pa11y API is online. Gebruik POST /scan met JSON { "url": "..." }. Voeg optioneel ?offset=0 toe voor paginering.");
});

const scanCache = new Map(); // eenvoudige cache per sessie (niet persistent)

app.post('/scan', async (req, res) => {
  const { url } = req.body;
  const offset = parseInt(req.query.offset || '0', 10); // 0, 5, 10, ...

  if (!url) {
    return res.status(400).json({ error: "Missing 'url' parameter." });
  }

  try {
    let result;

    // Gebruik cache als dezelfde URL eerder is gescand (tijdelijke opslag)
    if (scanCache.has(url)) {
      result = scanCache.get(url);
    } else {
      result = await pa11y(url, {
        standard: 'WCAG2AA',
        timeout: 120000,
        chromeLaunchConfig: {
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      });
      scanCache.set(url, result); // Cache het resultaat voor vervolgvragen
    }

    const allIssues = result.issues || [];
    const pageSize = 5;
    const paginated = allIssues.slice(offset, offset + pageSize);

    res.json({
      url,
      issueCount: allIssues.length,
      offset,
      nextOffset: offset + pageSize < allIssues.length ? offset + pageSize : null,
      issues: paginated
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
  console.log(`✅ Pa11y API with pagination running on port ${PORT}`);
});
