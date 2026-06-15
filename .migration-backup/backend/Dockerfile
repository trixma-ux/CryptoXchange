FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
RUN mkdir -p uploads logs
EXPOSE 4000
CMD ["node", "dist/index.js"]
