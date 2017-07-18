FROM node:4.8.3

MAINTAINER Chris Greenhalgh "chris.greenhalgh@nottingham.ac.uk"

EXPOSE 8000

COPY package.json /srv/archive/
RUN cd /srv/archive && npm install --production

ADD lib /srv/archive/lib
ADD templates /srv/archive/templates
COPY etc/server-config.yml /srv/archive/etc/config.yml
VOLUME /srv/archive/logs
VOLUME /srv/archive/output

WORKDIR /srv/archive

CMD [ "node", "lib/server.js" ] 
#CMD [ "sleep", "10000000"]