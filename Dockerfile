FROM node:12

WORKDIR /home/vbrugumalla/Documents/DockerProj/

COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

EXPOSE 3006
CMD [ "node", "index.js" ]