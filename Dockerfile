FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Explicitly copy views to dist for prod
RUN cp -r src/views dist/views

EXPOSE 3001
CMD ["npm", "run", "start:prod"]