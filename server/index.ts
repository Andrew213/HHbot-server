import express, { Express } from "express";
import { parse } from "qs";
import cookieParser from "cookie-parser";
import cors from "cors";
import router from "./router";
import dotenv from "dotenv";
import Agenda from "agenda";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import dayjs from "dayjs";

import "dayjs/locale/ru";

dotenv.config();

const server: Express = express();
server.use(
  cors({
    origin: "http://localhost:5173",

    credentials: true,
  })
);
server.use(cookieParser());
export const queryParser = (query: string) => {
  return parse(query, {
    decoder: (str) => {
      return decodeURIComponent(str);
    },
  });
};
const PORT = process.env.SERVER_PORT || 5000;

server.use(express.json());
server
  .use(express.urlencoded({ extended: true }))
  .disable("x-powered-by")
  .enable("trust proxy")
  .set("query parser", queryParser)
  .use(router);

const agenda = new Agenda({
  db: {
    address: process.env.MONGO_CONNECTION,
    collection: "scheduleJobs",
  },
});

mongoose
  .connect(process.env.MONGO_CONNECTION)
  .then(() => {
    console.log("MongoDB is Connected..");
  })
  .catch((err) => {
    console.log(err.message);
  });

const sendMails = async () => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "mega.zip2013@gmail.com", // Адрес отправителя
      pass: process.env.GMAIL_PASS, // Пароль приложения
    },
  });

  const collection = mongoose.connection.collection("scheduleJobs");

  const cursor = await collection.find({});
  const documents = await cursor.toArray();

  transporter.sendMail({
    from: "HHbot", // Адрес отправителя
    to: "a.kochanov31@yandex.ru", // Адрес получателя
    subject: "Тема из nodejs", // Тема письма
    text: `письмо пришло в ${dayjs()} 
    Данные из бд:  ${JSON.stringify(documents)}
    `, // Текст письма
  });
};

agenda.define("send mail", async (job, done) => {
  await sendMails();
  job.repeatEvery("24 hours", {
    skipImmediate: true,
  });
  job.save();
  done();
});

(async function () {
  await agenda.start();
  // тут остановился. играюсь с агенда
  await agenda.schedule("everyday at 13:30", "send mail", {});
})();

async function graceful() {
  await agenda.stop();
  await agenda.cancel({ name: "hello" });
  process.exit(0);
}

process.on("SIGTERM", graceful);
process.on("SIGINT", graceful);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default server;
