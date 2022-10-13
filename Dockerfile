FROM node:16.14-alpine3.14 as build-stage
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package*.json /usr/src/app/ 
RUN npm install
RUN npm install bull
RUN npm install @bull-board/express
RUN npm install @bull-board/ui
RUN npm install @bull-board/api
COPY . /usr/src/app
CMD [ "npm", "start" ]

# FROM node:16.14-alpine3.14 as build-stage
# RUN mkdir -p /usr/src/app
# WORKDIR /usr/src/app
# COPY package*.json /usr/src/app/ 
# RUN yarn install
# COPY . /usr/src/app
# CMD [ "yarn", "start" ]