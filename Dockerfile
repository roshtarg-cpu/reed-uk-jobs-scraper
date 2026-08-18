FROM apify/actor-node-playwright-chrome:20

COPY package*.json ./
RUN npm install --production

COPY . ./

CMD ["npm", "start"]
