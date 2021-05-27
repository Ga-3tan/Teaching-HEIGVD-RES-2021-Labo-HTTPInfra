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
docker build -t apache_static .
```

Puis un container peut être lancé avec la commande :

```sh
docker run -d -p 9090:80 --name apache_static res/apache_static
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
docker build -t res/express_dynamic .
docker run -d -p 9090:3000 res/express_dynamic
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

## 3 - Reverse proxy avec Apache (configuration statique)

L'utilisation du mode reverse proxy du serveur apache permet de n'avoir qu'un seul point d'entrée dans l'infrastructure lors des requêtes HTTP. Dépendant les chemins fournis aux requêtes HTTP, le reverse proxy va diriger la requête vers le serveur web approprié.

### Configuration du reverse proxy sur Apache httpd

Dans le dossier `/etc/apache2/` se trouve toute la configuration du serveur apache. Dans ce dossier se trouvent plusieurs sous-dossiers :

- sites-available -> Contient la liste des configurations de sites disponibles pour le serveur
- sites-enabled -> Contient la liste des sites actuellement activés sur le serveur

Un site est représenté par un fichier `.conf` contenant une balise `<VirtualHost>`. Pour activer le mode reverse proxy il faut créer un fichier `.conf` et placer divers éléments dans la balise `<VirtualHost>` :

- ServerName `<nom>` -> Le nom de l'en-tête host devant être fournie dans les requêtes HTTP
- ProxyPass `<route>` `<to>` -> Lorsque le serveur reçoit la route `<route>` il redirige la requête vers l'adresse `<to>`
- ProxyPassReverse `<route>` `<to>` -> Même chose que pour ProxyPass mais dans l'autre sens

Pour les serveurs Apache statique et express dynamique le fichier ressemble a ceci :

```sh
<VirtualHost *:80>
	ServerName demo.res.ch
	
	# Route for the dynamic express server
	ProxyPass "/api/" "http://172.17.0.2:3000/"
	ProxyPassReverse "/api/" "http://172.17.0.2:3000/"
	
	# Route for the static apache server
	ProxyPass "/" "http://172.17.0.3:80/"
	ProxyPassReverse "/" "http://172.17.0.3:80/"
</VirtualHost>
```

Ne pas oublier d'inclure les modules nécessaires pour que le serveur Apache puisse faire du reverse proxy, puis activer le site :

```sh
a2enmod proxy
a2enmod proxy_http
a2ensite <nomDuFichierSite>
service apache2 restart
```

Les deux serveurs sont maintenant accessibles via l'adresse et le port du proxy uniquement et peuvent être sélectionnés selon la route entrée dans la requête HTTP.

### Création du dockerfile pour le reverse proxy

Lîmage du reverse proxy peut être créer a partir d'un dockerfile assez simple :

```dockerfile
FROM php:7.2-apache
COPY conf/ /etc/apache2

RUN a2enmod proxy proxy_http
RUN a2ensite 000-* 001-*

EXPOSE 80
```

Dans le même dossier que le dockerfile doit se trouver un dossier `conf` contenant les fichiers `.conf` de configuration du site par défaut et du reverse proxy. Ces fichiers seront copiés dans le dossier `/etc/apache2/` de l'image à sa création.

Le commandes activant les modules proxy sont ensuite exécutées avec la commande `a2enmod`, puis les deux sites sont activés sur le serveur avec la commande `a2ensite`.

Le port 80 est a l'écoute de requêtes HTTP entrantes.

### Démarrer tous les serveurs

L'infrastructure est maintenant composée de trois serveurs distincs :

- res/apache_static -> Serveur statique de l'étape 1 du laboratoire
- res/express_dynamic -> Serveur Node.js et express.js dnamique de l'étape 2 du laboratoire
- res/apache_rp -> Reverse proxy Apache configuré pour rediriger vers res/apache_static ou res/express_dynamic selon l'en-tête `Host:` des requêtes

Pour démarrer tous les serveurs il suffit d'exécuter les commandes suivantes :

```sh
docker run -d --name express_dynamic res/express_dynamic
docker run -d --name apache_static res/apache_static
docker run -d -p 8080:80 --name apache_rp res/apache_rp
```

Le seul container ayant besoin d'un mappage de ports est le reverse proxy car il est le seul point d'entrée vers les autres serveurs de l'infrastructure.

### Le proxy comme seul point d'entrée

Dans cette nouvelle infrastructure, seul le proxy peut être utilisé pour joindre les deux autres serveurs car il est le seul ayant un port mappé sur la machine hôte.

Le proxy va rediriger les requêtes HTTP **à l'intérieur du réseau de la machine Docker** en fonction du champ `Host:` fourni dans l'en-tête. Cet en-tête `Host:` **doit** être `demo.res.ch` pour que le proxy retourne les bonnes représentations de ressources. Si le `Host:` n'est pas bon, la page retournée est une erreur 403 (Forbidden) car la requête n'est pas envoyée sur le bon nom de site. Pour cette infrastructure, un en-tête `/` redirige vers le site statique tandis que `/api/` redirige vers le site express.js dynamique.

### Configuration pas optimale et fragile

Un gros soucis avec cette configuration Docker et ces trois serveurs est que le fichier de configuration dans le proxy possède des adresses IP écrites en dur pour la redirection. Or, les serveurs statiques et dynamiques peuvent ne pas avoir la même adresse IP car cela est défini automatiquement par docker à la création du container.

Dans le cas ou les adresses IP ne sont pas les suivantes :

| Image du container  | Adresse IPv4        |
| ------------------- | ------------------- |
| res/apache_static   | 172.17.0.3          |
| res/express_dynamic | 172.17.0.2          |
| res/apache_rp       | N'importe la quelle |

Le proxy va rediriger les requêtes vers la mauvais adresse IP et il y aura des erreurs.

Il faudrait pouvoir s'assurer que les adresses des deux serveurs web soient fixes pour éviter ce genre de problème.

## 4 - Requêtes AJAX avec JQuery

### Mise à jour des images

Pour mettre plus de manipulations à l'intérieur des containers, il est pratique d'ajouter les commandes suivantes au Dockerfile qui vont installer automatiquement l'outil `vim` pour effectuer des modifications sur les ficheirs des containers.

```dockerfile
RUN apt-get update && apt-get install -y vim
```

### Création d'un script JS

L'outil `vim` est maintenant installé et il est donc possible de se connecter au container `apache_static` pour y ajouter un nouveau script Javascript.

En utilisant la commande :

```sh
docker exec -it apache_static /bin/bash
```

Il est possible de se connecter à un bash directement dans le container. Le dossier dans lequel s'ouvre le bash est le dossier contenant les ficheirs du serveur web. Le fichier `index.html` correspond à la page d'accueil du site. Les scripts JS sont contenus dans le dossier `/js`.

Il suffit d'ajouter le code suivant pour charger le script `students.js` dans la page d'accueil :

```html
<script src="js/students.js"></script>
```

Le contenu du script est le suivant :

```javascript
$(function() {
  console.log("Loading students");
})
```

### Modification dynamique du DOM avec AJAX

Le script Javascript peut être utilisé pour modifier le document html de façon dynamique sans avoir à recharger la page web. Pour se faire il suffit d'exécuter une requête `AJAX` qui va récupérer des données (un `JSON` par exemple) et va les afficher priodiquement à l'écran.

```js
$(function() {
    console.log("Loading animals");

    // Function that displays an animal name
    function loadAnimals() {
        
        // Selects the category
        var value = Math.floor(Math.random() * 3);
        var category = "ocean";
        if (value == 1) { category = "desert"; }
        else if (value == 2) { category = "pet"; }

        // Sets the message
        $.getJSON("/api/animals/" + category + "/", function(animals) {
            var message = "No animal found";
            if (animals.length > 0) {
                message = animals[0].name + " the " + animals[0].species + " says hello !"
            }
            $(".skills").text(message);
        });
    };

    // Loads the function periodically
    loadAnimals();
    setInterval(loadAnimals, 2000);
});
```

Ce script est chargé par la page `index.html`.

### Pourquoi la démo ne fonctionnerait pas sans reverse proxy

Le rôle du reverse proxy est de reçevoir toutes les requêtes dirigées vers le serveur `Apache` statique ou `NodeJS` dynamique.

Premièrement, il n'est pas possible de joindre les serveurs `Apache` ou `NodeJS` directement car il n'ont pas de port disponible en dehors du réseau docker. Le seul port disponible est celui du reverse proxy et cela implique donc une seule entrée possible.

Ensuite, le nom de host à respecter est défini par le reverse proxy et doit être `demo.res.ch` pour que la redirection se fasse correctement.

Il n'est donc pas possible de contacter directement les serveurs `Apache` et `NodeJS` sans passer par le reverse proxy.

## 5 - Configuration dynamique du reverse proxy

Le but de cette partie est de résoudre le problème concernant les adresses IP des containers `Apache` et `NodeJS` afin que le reverse proxy gère ces dernières de façon dynamique.

Pour ce faire, il est possible d'utilise Docker Compose pour lancer toutes les images et créer un réseau dans lequel les images se connaissent par leur nom d'hôte. Grâce à cela, le reverse proxy peut utiliser les noms d'hote des serveurs Apache et NodeJS dans sa configuration.

En effet, selon la documentation Docker, si plusieur containers se trouvent dans un même réseau **définit manuellement par l'utilisateur**, ils peuvent se contacter grâce à leur nom d'hôte qui est le nom du container docker. Il n'y a donc plus besoin de conaître l'adresse IP exacte des serveurs, le `DNS` intégré à docker se chargera de traduire les noms d'hôte.

### Configuration de Docker Compose

La configuration est simple. Premièrement, il faut modifier le fichier de configuration du reverse proxy en remplaçant les adresses IP par les noms des containers docker.

Ensuite, il faut créer un ficheir `docker-compose.yaml` dans lequel on place les containers à créer et le réseau dans lequel ils se trouveront :

```yaml
version: "3.9"
services:
  apache_static:
    image: res/apache_static
    container_name: apache_static
    networks:
      - res-net
  express_dynamic:
    image: res/express_dynamic
    container_name: express_dynamic
    networks:
      - res-net

  apache_rp:
    image: res/apache_rp
    container_name: apache_rp
    ports:
      - 8080:80
    networks:
      - res-net

networks:
  res-net:
```

Pour lancer tous les containers, il suffit d'utiliser la commande suivante dans le dossier du fichier `docker-compose.yaml `:

```sh
docker compose up
```

