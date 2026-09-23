FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package*.json ./
COPY packages/Vibe-Workflow/packages/workflow-builder/package*.json ./packages/Vibe-Workflow/packages/workflow-builder/
COPY packages/Open-Poe-AI/packages/agents/package*.json ./packages/Open-Poe-AI/packages/agents/
COPY packages/studio/package*.json ./packages/studio/
RUN npm install

# Build sub-packages & Next.js
FROM deps AS builder
COPY . .
RUN npm run build:packages
RUN npm run build

# Production runner
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=58101
ENV HOSTNAME="0.0.0.0"

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/data ./data
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/src ./src
COPY --from=builder /app/app ./app

EXPOSE 58101
CMD ["npm", "start"]
