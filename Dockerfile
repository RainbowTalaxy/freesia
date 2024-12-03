FROM node:18-alpine AS builder
ENV TZ="Asia/Shanghai"
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
ENV STANDALONE=true
RUN yarn build
RUN cp -r public/ .next/standalone/public/
RUN cp -r .next/static/ .next/standalone/.next/static/



FROM node:18-alpine AS runner
ENV TZ="Asia/Shanghai"
WORKDIR /app

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.mjs ./next.config.mjs

ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME="0.0.0.0"
EXPOSE 3000
CMD ["node", ".next/standalone/server.js"]
