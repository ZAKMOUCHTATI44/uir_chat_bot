import express, { Request, Response } from "express";
import { askQuestion } from "./answer";
import { sendMessage } from "./lib/sendMessage";
import { handleAudio } from "./audio";
require("dotenv").config();

const app = express();
app.use(express.urlencoded({ extended: true }));

app.use(express.json());

app.post("/chat", async (req: Request, res: Response) => {
  const { message } = req.body;

  if (message.MediaContentType0 === "audio/ogg") {
    const question = handleAudio(message.MediaUrl0);
  } else {
    const response = await askQuestion(message);
    res.json({ response });
  }
});

app.post("/chat-bot", (req: Request, res: Response) => {
  const { question } = req.body;

  res.json({ question: question });
});
app.post("/uir-chat-bot", async (req: Request, res: Response) => {
  const message = req.body;

  if (message.MediaContentType0 === "audio/ogg") {
    const question = await handleAudio(message.MediaUrl0);

    console.log(question);
    sendMessage(message.From, question);
  } else {
    sendMessage(message.From, message.Body);
  }

  res.send("Hey");
});
app.listen(4000, () => {
  console.log("App Started !!!");
});
