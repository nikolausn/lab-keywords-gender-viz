FROM ubuntu:14.04

USER root

RUN apt-get update && \ 
        apt-get install -y python-software-properties python g++ make software-properties-common
        FROM ubuntu:14.04

USER root

RUN apt-get update && \ 
        apt-get install -y python-software-properties python g++ make software-properties-common
        
RUN apt-get install -y curl

RUN apt-get install -y git 

# install ruby
RUN apt-get install -y ruby-full ruby autogen autoconf libtool

# Create app directory
WORKDIR /usr/src/app

#RUN gem install scss_lint -v 0.53.0

RUN apt-get install -y vim 

RUN apt-get install -y zip

#COPY *.zip .

RUN curl -sL https://deb.nodesource.com/setup_6.x | bash - && sudo apt-get install -y nodejs

#RUN npm install -g sails@0.12.11 bower@1.8.0 gulp@3.9.0
RUN npm install -g sails@0.12.11 bower@1.8.8 gulp@3.9.0

RUN gem install scss_lint -v 0.45.0

RUN git clone https://github.com/nikolausn/lab-keywords-gender-viz /usr/src/app

#COPY *.sh .

COPY .tmp ./backend/.tmp

RUN cd backend && npm install 

COPY bower.json ./frontend/bower.json

RUN cd frontend && bower install --allow-root && npm install
#RUN cd frontend && npm install

RUN cd frontend && gulp dist

COPY config.json ./frontend/config/

#RUN rm -rf backend/node_modules/waterline-sqlite3

RUN cp -r backend/waterline-sqlite3 backend/node_modules/

COPY index.html ./frontend/dist/index.html

COPY local_notused.js ./backend/config/

EXPOSE 80 1337

CMD [ "npm", "start" ]