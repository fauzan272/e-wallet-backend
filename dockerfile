FROM node:20-alpine
WORKDIR /app
      # base image
             # folder kerja
COPY package*.json ./   
RUN npm ci --omit=dev
COPY . .
EXPOSE 5000
CMD ["npm", "start"]