import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/generate', async (req, res) => {
  const { prompt, history } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const chat = model.startChat({
      history: history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })),
      generationConfig: {
        maxOutputTokens: 2048,
      },
    });

    const result = await chat.sendMessage(`Please generate HTML/CSS/JS code for the following request. Return ONLY the raw HTML code without markdown formatting or codeblocks: ${prompt}`);
    const response = await result.response;
    let text = response.text();
    
    // Strip markdown formatting if the model still returns it
    text = text.replace(/^```(html)?\n/g, '').replace(/\n```$/g, '');

    res.json({ code: text });
  } catch (error) {
    console.error('Error generating code:', error);
    res.status(500).json({ error: 'Failed to generate code', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});