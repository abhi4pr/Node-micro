=>
update this in ur package.json file under script object
"start": "node src/server.js",
"dev": "nodemon src/server.js"

=>
add this in root object in package.json
"type": "module",

=>
run this to install nodemon
npm i nodemon --save-dev

=>
to install docker in ubuntu run these commands:-
sudo apt install ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
 sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
 "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
 https://download.docker.com/linux/ubuntu \
 $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
 sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

=>
to check if docker installed or not
docker --version

=>
to check if docker successfully working
sudo docker run hello-world

=>
if facing permission issue on docker commands withouts sudo run these commands:-
groups
sudo usermod -aG docker tw
newgrp docker

=>
to see all running services => docker ps

=>
to start service => docker run -d --name redis-server -p 6379:6379 redis

=> for each service we are making need to map the port within api gateway

=> to run api hit this
http://localhost:5001/api/auth/register
and for api gateway try this
http://localhost:3000/v1/auth/register

for post creation api hit this
http://localhost:5000/v1/posts/create-post
also pass access_token in auth

for mediaupload api,
http://localhost:5000/v1/media/upload

=>
erlang is req to run rabbitmq, and rabbitmq is required to run amqb.

=> to install rabbitmq in docker
docker run -d \
 --name rabbitmq \
 -p 5672:5672 \
 -p 15672:15672 \
 rabbitmq:3-management

docker start rabbitmq

=>
we can access the rabbitmq link using http://localhost://15672 but for env it will be amqp://localhost:5672

=> we just need to create rabbitmq connection in separate file and call that connection in server.js file
