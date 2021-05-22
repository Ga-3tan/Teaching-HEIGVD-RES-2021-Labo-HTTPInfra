docker run -d --name apache_static res/apache_php
docker run -d --name express_dynamic res/node_express
docker run -d -p 8080:80 --name apache_rp res/apache_rp