FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 5000

CMD ["npm", "run", "start", "--", "-p", "5000", "-H", "0.0.0.0"]
