FROM node:22-alpine

RUN apk add --no-cache --virtual .build-deps python3 make g++ sqlite-dev \
    && apk add --no-cache sqlite-libs

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev \
    && apk del .build-deps

COPY . .

ENV PORT=3000
EXPOSE 3000

VOLUME ["/app/data"]

CMD ["node", "server.js"]
