require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🔁 Summarization function with FULL error logging
async function summarizeText(text) {
  const prompt = `Summarize the following article in 5-6 concise sentences:\n\n${text}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful summarizer.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content.trim();
  } catch (err) {
    console.error("❌ OpenAI summarization error:", err?.response?.data || err.message || err);
    throw new Error("Failed to generate summary");
  }
}

// 📥 Extract + Summarize Route
app.post('/extract', async (req, res) => {
  const { url } = req.body;
  console.log("📥 Received URL:", url);

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  if (url.includes('twitter.com') || url.includes('x.com')) {
    return res.status(400).json({ error: 'Twitter/X links not supported.' });
  }

  try {
    console.log("🌐 Fetching article...");
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 20000,
    });

    console.log("✅ Article fetched.");
    const dom = new JSDOM(response.data, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article || !article.textContent) {
      console.log("⚠ Article parsing failed.");
      return res.status(422).json({ error: 'Could not extract meaningful content' });
    }

    console.log("📝 Article content length:", article.textContent.length);

    if (article.textContent.length > 200) {
      const trimmedContent = article.textContent.trim().slice(0, 5000); // Reduce if hitting token limit
      const summary = await summarizeText(trimmedContent);
      console.log("✅ Summarization complete.");

      return res.json({
        title: article.title,
        summary,
      });
    } else {
      console.log("⚠ Content too short.");
      return res.status(422).json({ error: 'Content too short or not meaningful' });
    }
  } catch (err) {
    console.error('❌ Extraction or summarization failed:', err?.response?.data || err.message || err);
    res.status(500).json({ error: 'Processing failed', details: err.message });
  }
});

// 🧪 Optional: Direct summarization test
app.post('/summarize', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text required' });

  try {
    const summary = await summarizeText(text);
    return res.json({ summary });
  } catch (err) {
    console.error("❌ Direct summarize test failed:", err?.response?.data || err.message || err);
    return res.status(500).json({ error: "Failed to summarize", details: err.message });
  }
});

// ✅ Health Check
app.get('/', (req, res) => {
  res.send('✅ Rman backend (debug version) is running');
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
