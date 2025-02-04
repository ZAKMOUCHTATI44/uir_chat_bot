import express, { Request, Response } from 'express'
import { askQuestion } from './answer'
import { sendMessage } from './lib/sendMessage'

const app = express()

app.use(express.json())

app.post("/chat" , async (req : Request , res : Response) => {
    const { message } = req.body
    const response  = await askQuestion(message)
    res.json({response})
})


app.post('/uir-chat-bot' , async (req:Request , res :Response) => {
    const message = req.body;
    sendMessage(message.From , message.Body)

    res.send("Hey")
})
app.listen(4000 , () => {
    console.log("App Started !!!")
})