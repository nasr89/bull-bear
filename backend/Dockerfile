FROM node:22-alpine AS base
RUN apk add --no-cache openssl
WORKDIR /app

FROM base AS build
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm prune --omit=dev

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/src ./src
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
