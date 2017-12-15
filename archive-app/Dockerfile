FROM node:8.9.1-stretch

RUN mkdir -p /root/work
WORKDIR /root/work

RUN apt-get update && apt-get install -y zip

# bootstrap project
#RUN npm install @angular/cli

#hub-app/package-lock.json 
COPY package.json .

RUN npm install

COPY . .
RUN `npm bin`/ng build -bh /1/archive/
RUN cd dist; tar zcf ../archive.tgz *

# ng serve
EXPOSE 4200
# karma testing
EXPOSE 9876
