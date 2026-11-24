# Build and run the app in one container. Needs DATABASE_URL at runtime.
FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

# Create/update the database tables, then start the server
CMD ["sh", "-c", "npm run db:push:force && npm start"]
