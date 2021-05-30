FROM node:14.17.0

RUN apt-get update && \
    apt-get install -y vim

COPY src /opt/app

EXPOSE 3000

CMD ["node", "/opt/app/index.js"]