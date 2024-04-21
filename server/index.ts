import express, { Express } from "express";
import { parse } from "qs";
import cookieParser from "cookie-parser";
import cors from "cors";
import router from "./router";
import dotenv from "dotenv";
import Agenda from "agenda";

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
    address:
      "mongodb+srv://andreybelii2017:BcrvEHOQUWmGrFGu@cluster1.2zmeidz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1",
    collection: "scheduleJobs",
  },
});

agenda.define("hello", async (job, done) => {
  console.log(`slam allekum minute`);
});

(async function () {
  await agenda.start();
  agenda.schedule("everyday at 15:40", "hello", {});
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
