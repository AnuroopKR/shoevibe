FROM node:18

ENV NODE_ENV=production

WORKDIR /app.js

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install --production

COPY . .

EXPOSE 3000

CMD [ "node", "app.js" ]