FROM ubuntu
RUN adduser -u 10014 appuser
USER 10014

FROM node:18-buster-slim

COPY package.json .
RUN npm install

COPY . .
# COPY ./.env .

RUN touch db.sqlite
RUN chmod +x db.sqlite

COPY database.json .
RUN npm run db-config

RUN npm run migrate-up
RUN npm run db-seed

CMD ["npm", "start"]