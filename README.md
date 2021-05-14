# RES | Laboratoire infrastructure HTTP

## 1 - Serveur statique avec Apache httpd

### Récupération et lancement de l'image Docker Apache httpd avec php

L'image Docker httpd avec php a été récupérée sur [Docker hub](https://hub.docker.com/_/php/) à l'adresse de l'image php, qui offre une version d'Apache httpd avec php configuré.

#### Lancement sans image Docker

Un premier lancement de l'image a été fait pour tester le container. La commande suivante permet de lance le container sans image docker :

```sh
docker run -d -p 9090:80 php:7.2-apache
```

Le port 80, ouvert dans le container a été mappé sur le port 9090 de la machine hôte.

Il est donc possible de se connecter au container en telnet sur l'adresse 127.0.0.1:9090

#### Lancement avec image Docker

Pour lancer l'image, un Dockerfile a été crée avec les instructions suivantes :

```dockerfile
FROM php:7.2-apache
COPY content/ /var/www/html/
```

L'image peut donc être créée grâce à la commande (dans le dossier du dockerfile) :

```sh
docker build -t apache/php .
```

Puis un container peut être lancé avec la commande :

```sh
docker run -d -p 9090:80 --name apache-php-container apache/php
```

#### Copie ou lien avec un dossier du host

Le serveur web apache qui tourne dans le container affiche le contenu html présent dans le dossier `/var/www/html`.

Il est possible de placer des fichiers dans ce dossier depuis la machine hôte de deux façons différentes.

##### La copie d'un dossier local

La première variante consiste à copier tout le contenu d'un dossier local dans le dossier `/var/www/html` du container **à sa création**. Cela est fait dans le dockerfile avec la ligne :

```dockerfile
COPY content/ /var/www/html/
```

Le contenu une fois copié ne sera pas mis à jour en cas de modification dans le dossier local, et en cas de redémarrage du container, toutes les modifications faites aux fichiers html à l'intérieur du container seront perdues !

##### Monter un volume dans le container sur un dossier local

La deuxième variante consiste à monter un volume à l'intérieur du container dans le dossier `/var/www/html` pointant sur un dossier local de la machine hôte. Cela peut être fait lors de la commande run avec l'option `--volume`.

Cela permet de modifier en direct les fichiers dans le dossier local et ceux-ci seront modifiés dans le dossier du container. Les modifications ne seront pas perdues à la fermeture du container.

## 2 - Serveur HTTP dynamique avec express.js

Un dockerfile avec une image Node.js et une copie de dossier `./src` a été crée. L'image peut être créée et lancée avec les commandes :

```sh
docker build -t res/express_students .
docker run -d -p 9090:3000 res/express_students
```

La version de Node.js utilisée est `14.17` et un `package.json` a été crée avec `npm init` dans le dossier src qui sera copié dans le dossier `/opt/app` du container à sa création. Le port mapping est nécessaire pour accéder à l'application express.js depuis la machine hôte.

### Configuration de express.js

Dans le dossier src qui sera copié dans l'image, il faut faire la commande suivante pour créer un nouveau projet Node :

```sh
npm init
```

Ensuite, il faut simplement créer un fichier `index.js` qui sera exécuté par Node dans le container car dans le dockerfile il est demandé d'exécuter la commande `node /opt/app/index.js` avec la ligne :

```dockerfile
CMD ["node", "/opt/app/index.js"]
```

### Contenu du fichier index.js

Le fichier `index.js` utilise `chance.js` et `express.js` pour gérer plusieurs routes et retourner des données `json` selon la route choisie.

#### Liste d'animaux

Les routes retournent une liste d'animaux selon le type d'animal voulu. A l'adresse HTTP racine, une simple indication des routes disponibles est donnée.

#### Routes possibles

- / -> Point d'entrée de l'application

- /animals/ocean -> Retourne une liste d'animaux marins
- /animals/desert -> Retourne une liste d'animaux du désert
- /animals/pet -> Retourne une liste d'animaux domestiques

