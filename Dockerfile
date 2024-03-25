FROM node:18-buster-slim
WORKDIR /app/tutoree/

COPY package.json /app/tutoree/
RUN npm install

COPY . /app/tutoree/
COPY .env /app/tutoree/

RUN touch /app/tutoree/db.sqlite
RUN chmod +x /app/tutoree/db.sqlite

COPY database.json /app/tutoree/
RUN npm run db-config

RUN npm run migrate-up
RUN npm run db-seed

CMD ["npm", "start"]