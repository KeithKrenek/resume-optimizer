import express from 'express';
import { Server } from 'socket.io';
import OpenAI from 'openai';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs';

const app = express();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const ASSISTANT_ID = process.env.ASSISTANT_ID;

const upload = multer({ dest: '/tmp/uploads/' });

app.use(cors());
app.use(express.json());

app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  try {
    const file = await openai.files.create({
      file: fs.createReadStream(req.file.path),
      purpose: 'assistants',
    });

    fs.unlinkSync(req.file.path);

    res.json({ fileId: file.id });
  } catch (error) {
    console.error('Error uploading file to OpenAI:', error);
    res.status(500).json({ error: 'An error occurred while uploading the file.' });
  }
});

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  try {
    const thread = await openai.beta.threads.create();
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID
    });

    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);

    while (runStatus.status !== 'completed') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    const messages = await openai.beta.threads.messages.list(thread.id);

    const assistantMessages = messages.data
      .filter(msg => msg.role === 'assistant')
      .map(msg => msg.content[0].text.value);

    res.json({ message: assistantMessages[0] });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});

if (process.env.NODE_ENV !== 'production') {
  const httpServer = app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
  });
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  
  io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('sendMessage', async (message) => {
      try {
        const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message }),
        });

        if (!response.ok) {
          throw new Error('Failed to get response from chat API');
        }

        const data = await response.json();
        socket.emit('message', data.message);
      } catch (error) {
        console.error('Error:', error);
        socket.emit('error', 'An error occurred while processing your request.');
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });
}

export default app;