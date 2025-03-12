import { askQuestion } from "../answer";
import { twilioInstance } from "./twilio";

export async function sendMessage(sendTo: string , message : string) {
  const client = await twilioInstance();

  const messaegBody = await askQuestion(message);

  client.messages
    .create({
      body: messaegBody,
      from: "whatsapp:+212719507879",
      to: sendTo,
    })
    .then((res) => {
      console.log(res);
    })
    .catch((err) => {
      console.log(err);
    });
}
