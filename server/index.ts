import 'dotenv/config';
import express, { Express } from 'express';
import { parse } from 'qs';
import Agenda from 'agenda';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from "helmet";
import router from './router';

import 'dayjs/locale/ru';

const server: Express = express();
server.use(
    cors({
        origin: 'http://localhost:5173',

        credentials: true
    })
);
server.use(cookieParser());
export const queryParser = (query: string) => {
    return parse(query, {
        decoder: str => {
            return decodeURIComponent(str);
        }
    });
};
const PORT = process.env.SERVER_PORT || 5000;

server.use(express.json());
server.use(helmet())
server
    .use(express.urlencoded({ extended: true }))
    .disable('x-powered-by')
    .enable('trust proxy')
    .set('query parser', queryParser)
    .use(router);

export const agenda = new Agenda({
    db: {
        address: process.env.MONGO_CONNECTION,
        collection: 'scheduleJobs'
        // collection: 'scheduleTest'
    }
});

agenda.start();

async function graceful() {
    await agenda.stop();
    process.exit(0);
}

process.on('SIGTERM', graceful);
process.on('SIGINT', graceful);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default server;
