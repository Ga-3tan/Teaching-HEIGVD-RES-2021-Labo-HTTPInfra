#!/bin/bash

docker run -d --name apache_static res/apache_static
docker run -d --name express_dynamic res/express_dynamic
docker run -e STATIC_APP=172.17.0.2:80 -e DYNAMIC_APP=172.17.0.3:3000 -d -p 8080:80 --name apache_rp res/apache_rp