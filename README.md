# RES | Laboratoire infrastructure HTTP

## 1 - Serveur statique avec Apache httpd

### Récupération et lancement de l'image Docker Apache httpd avec php

L'image Docker httpd avec php a été récupérée sur [Docker hub](https://hub.docker.com/_/php/) à l'adresse de l'image php, qui offre une version d'Apache httpd avec php configuré.

Un premier lancement de l'image a été fait pour tester le container. La commande suivante permet de lance le container sans image docker :

```sh
docker run -d -p 9090:80 php:7.2-apache
```

Le port 80, ouvert dans le container a été mappé sur le port 9090 de la machine hôte.

Il est donc possible de se connecter au container en telnet sur l'adresse 127.0.0.1:9090

Pour lancer l'image, un Dockerfile a été crée avec les instructions suivantes :

```dockerfile
FROM php:7.2-apache
COPY src/ /var/www/html/
```

