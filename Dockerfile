# ─── Frontend (Vite build) ───────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build

# ─── Backend (Node.js/Express) ──────────────────────────────────────────────
FROM node:20-alpine AS backend-builder
WORKDIR /backend
COPY backend/package*.json ./
RUN npm ci --omit=dev

# ─── Production Image ────────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

# Copy frontend build
COPY --from=frontend-builder /app/dist ./dist
COPY --from=frontend-builder /app/node_modules ./node_modules
COPY package*.json ./

# Copy backend
COPY --from=backend-builder /backend/node_modules ./backend/node_modules
COPY backend/ ./backend/

# Create upload directory
RUN mkdir -p /app/backend/uploads

# Expose ports
EXPOSE 3000 3001

# Environment
ENV NODE_ENV=production
ENV DB_TYPE=sqlite
ENV PORT=3001

# Start both frontend and backend
CMD ["sh", "-c", "node backend/server.js & npx serve dist -l 3000"]
