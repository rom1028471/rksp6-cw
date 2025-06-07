FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache build-base python3 postgresql-client

COPY wait-for-postgres.sh .
RUN chmod +x ./wait-for-postgres.sh

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

EXPOSE 5000

CMD ["npm", "start"] 