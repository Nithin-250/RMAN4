const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/extract', async (req, res) => {
  const { url } = req.body;

  console.log("📥 Received URL:", url);

  // Validate the URL input
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  // Block specific domains
  if (url.includes('twitter.com') || url.includes('x.com')) {
    return res.status(400).json({ error: 'Twitter/X links not supported.' });
  }

  try {
    console.log("🌐 Fetching URL with axios...");
    const response = await axios.get(url, {
      headers: {
        'User -Agent': 'Mozilla/5.0',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 20000,
    });

    // Parse the HTML response
    const dom = new JSDOM(response.data, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    // Check if the extracted content is valid
    if (article?.textContent && article.textContent.length > 200) {
      console.log("✅ Extraction success!");

      // Summarize the content
      const summary = summarizeText(article.textContent.trim());

      res.json({
        title: article.title,
        summary: summary,
      });
    } else {
      console.log("⚠ Content too short or invalid");
      res.status(422).json({ error: 'Content too short or not meaningful' });
    }
  } catch (err) {
    console.error('❌ Extraction failed:', err.message);
    res.status(500).json({ error: 'Extraction failed', details: err.message });
  }
});

// Simple text summarization function
function summarizeText(text) {
  const sentences = text.split('. ');
  if (sentences.length <= 2) {
    return text; // Return the original text if it's too short
  }
  
  // Return the first two sentences as a simple summary
  return sentences.slice(0, 2).join('. ') + '.';
}

// ✅ Health check route
app.get("/", (req, res) => {
  res.send("✅ Rman backend (axios version) is running");
});

// ✅ Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
