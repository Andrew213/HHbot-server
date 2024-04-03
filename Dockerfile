ARG NODE_VERSION=21
ARG SERVER_PORT=5000

FROM node:$NODE_VERSION-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE $SERVER_PORT
CMD [ "npm", "run", "start" ]