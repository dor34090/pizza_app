FROM node:17.3.1-alpine

WORKDIR /assignment

COPY ./package.json ./


RUN npm install

COPY . .

CMD ["node", "app.ts"]