# 빌드 스테이지
FROM node:22 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 프로덕션 스테이지
FROM node:22-slim
WORKDIR /app

RUN mkdir -p public/images/icons

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY package*.json ./

RUN npm ci --only=production
CMD ["npm", "run", "start:prod"]