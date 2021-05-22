# RES | Laboratoire infrastructure HTTP

---

## 1. Mise en place d'un serveur httpd avec Docker

### Récupération d'une image docker httpd apache 

on utilise l'image docker officielle de php-apache depuis docker hub

##### on créer le Dockerfile suivant :

```dockerfile
FROM php:7.2-apache
COPY content/ /var/www/html/
```

- la première ligne spécifie l'image à utiliser

- la deuxième ligne va copier tous ce qu'il y a dans `content/` pour dans le dossier `html/` qui se trouve à `/var/www` dans le container
  - le dossier content copié dans le dossier html sera la source de notre serveur où on mettra tous nos fichier html

(parler des fichiers de configurations: `/etc/apache2/sites-available/000-default.conf` => `DocumentRoot : chemin de base du serveur` (à modifier si on change la ligne COPY du Dockerfile, par défaut `/var/www/html/`))

### Build de l'image docker du serveur

##### commande de build : 

```bash
docker build -t res/apache_php .
```

- le `-t [tag]` spécifie le nom (tag) de l'image à construite

- le `.` spécifie qu'il va construire depuis le fichier courant

Cette commande se trouve dans un fichier `build-image.sh` au même niveau que le Dockerfile

### Run du serveur dans un container

##### commande de run : 

```bash
docker run -d -p 9090:80 res/apache_php
```

- `-d` permet de lancer le serveur en arrière plan
- `-p 9090:80` permet de mapper le port 9090 du host au port TCP 80 du container
- `res/apache_php` c'est le tag/nom de l'image depuis lequel on créer un container

Cette commande se trouve dans un fichier `run-container.sh` au même niveau que le Dockerfile

##### Pour accéder au bash du container, on peut utiliser la commande :

```bash
docker exec -it [nomDuContainer] /bin/bash
```

## 2. Serveur HTTP dynamique avec express.js

### Récupération d'une image docker node 14.17.0

on utilise l'image docker officielle de node depuis docker hub

##### on créer le Dockerfile suivant :

```dockerfile
FROM node:14.17.0
COPY src /opt/app
CMD ["node", "/opt/app/index.js"]
```

- la première ligne spécifie l'image à utiliser, l'image de node 14.17.0 (latest)
- la deuxième ligne va copier tous ce qu'il y a dans `src` pour dans le dossier `/opt/app`
- la troisième ligne va exécuter la commande `node /opt/app/index.js` qui va lancer le script index.js au démarrage du container (`npm start`)

### Création d'un projet node.js dans src

On commence par initialiser un projet node.js avec :

```bash
npm init
```

Puis installer la dépendance node.js *chance* avec :

```bash
npm install --save chance
```

qui va créer une entrée "dependance" dans package.json ainsi qu'un dossier node_module qui contiendra toutes les dépendances (il est lourd).

On créer notre fichier index.js et on y fait un simple programme qui affiche un nom aléatoire avec *chance* (ceci est juste un test pour voir si la dépendance et le serveur fonctionnent) :

```javascript
var Chance = require('chance')
var chance = new Chance();

console.log("Bonjour " + chance.name());
```

et on l'exécute dans le terminal avec :

```bash
node index.js
```

Lorsque l'ont se connecte, cela va retourner : "Bonjour  [un nom au hasard]" .

On va ensuite tester l'exécution du script dans le container docker en liant le port 3000 du container avec le port 8080 du host :

```bash
docker build -t res/node_express .

docker run -p 8080:3000 res/node_express
```

cela va afficher le même résultat que l'étape précédente mais depuis le container.

### Application express avec Docker

Installation de Express.js dans le projet node avec :

```bash
npm install --save express
```

dans notre index.js on ajoute :

- le serveur express.js :

```javascript
var express = require('express');
var app = express();
```

-  Les end-points `/`, `/knock-knock` et  `/coin-flip/:face` pour les requêtes GET :

```javascript
var knockknock = require('knock-knock-jokes');
app.get('/knock-knock', function(req, res) {
    res.send(knockknock());
});

app.get('/coin-flip/:face', function(req, res) {
    var coin = chance.coin();
    var response = "It's " + coin + ". ";
    if (req.params.face != "tails" && req.params.face != "heads") {
        res.send("You must bet : tails or heads");
    } else if (coin == req.params.face) {
        res.send(response + "Congrats you won : " + chance.dollar());
    } else {
        res.send(response + "You lost : " + chance.dollar());
    }
});

app.get('/', function(req, res) {
    res.send("Hello, this endpoint is empty, try /coin-flip/:face or /knock-knock");
});
```

Ces end-points font : 

`/knock-knock` retourne une blague du type *toc-toc qui est là*

`/coin-flip/:face` retourne si l'utilisateur a gagné ou pas à pile ou face (il doit spécifier *heads* ou *tails* à la place de `:face`)

- La fonction express qui va permettre au serveur d'écouter sur le port 3000 :

```javascript
app.listen(3000, function() {
    console.log("Accepting HTTP requests on port 3000.");
});
```

*Note* : le end-point `/` doit se trouver après les autres sinon il sera toujours pris.

### 3. Reverse proxy

- On créer 2 container : le `express_dynamic` et le `apache_static`, qui seront nos deux serveurs :

```bash
$ docker run -d --name apache_static res/apache_php
$ docker run -d --name express_dynamic res/node_express
```

- On cherche leur adresse IP :

```bash
$ docker inspect apache_static | grep -i ipaddress
            "SecondaryIPAddresses": null,
            "IPAddress": "172.17.0.3",
                    "IPAddress": "172.17.0.3",
$ docker inspect express_dynamic | grep -i ipaddress
            "SecondaryIPAddresses": null,
            "IPAddress": "172.17.0.4",
                    "IPAddress": "172.17.0.4",
```

On observe donc qu'on a notre serveur statique `apache_static` qui tourne à l'adresse `172.17.0.3` sur le port `80`

Et notre api dynamique `express_dynamic` qui tourne à l'adresse `172.17.0.4` sur le port `3000`

*Note* : attention à ne pas refermer ces containers, sinon leur adresse IP ne sera plus la même (car Docker les alloue dynamiquement). Cela rend notre système très fragile car il suffit que Docker décide d'allouer une adresse différente à l'un de serveur pour qu'il y ait des problèmes.

Maintenant il faut créer le serveur reverse proxy pour pouvoir aiguiller les requêtes sur les serveurs respectifs, pour cela on va créer une nouvelle image `res/apache_rp`  avec le Dockerfile suivant :

```dockerfile
FROM php:7.2-apache

COPY conf/ /etc/apache2

RUN a2enmod proxy proxy_http
RUN a2ensite 000-* 001-*

EXPOSE 80
```

Dans ce Dockerfile on créer une image à partir d'un serveur `apache php (ver 7.2)` et on va copier les configurations du dossier `sites-available` (plus précisément les fichier `000-default.conf` et `001-reverse-proxy.conf`) dans notre container.

On va ensuite configurer le proxy dans `001-reverse-proxy.conf` de la façon suivante :

```xml
<VirtualHost *:80>
    ServerName demo.res.ch
    
    #ErrorLog ${APACHE_LOG_DIR}/error.log
    #CustomLog ${APACHE_LOG_DIR}/access.log combined
    
    ProxyPass "/api/fun/" "http://172.17.0.3:3000/"
    ProxyPassReverse "/api/fun/" "http://172.17.0.3:3000/"
    
    ProxyPass "/" "http://172.17.0.2:80/"
    ProxyPassReverse "/" "http://172.17.0.2:80/"
</VirtualHost>
```

Dans ce fichier, on ajoute le nom du serveur qui servira pour être reconnu par l'en-tête http `Host`. Pour l'instant on va garder les Log commenté à cause d'une erreur de l'image, on y reviendra plus tard.

On configure ensuite le ProxyPass et ProxyPassReverse qui vont servir d'aiguillage vers nos deux serveurs. On l'a configuré de cette façon :

- Si la requêtes commence par /api/fun/ elle va être redirigée vers le serveur `express_dynamic` à l'adresse `http://172.17.0.3:3000/`
  - on pourra ainsi faire les requêtes `/knock-knock` pour avoir une blague ou jouer à pile ou face avec `/coin-flip/[heads, tails]`.
- Si celle-ci commence n'est pas `/api/fun/` elle va être redirigée vers le serveur `apache_static`  à l'adresse `http://172.17.0.2:80/`
  - on pourra ainsi voir la page web retournée par le serveur statique.

*Note* : pour le `000-default.conf`, on laisse l'intérieur de VirtualHost vide.

Il faut maintenant faire en sorte que notre browser utilise l'en-tête `Host: demo.res.ch` lorsqu'on essaie d'y accéder. Pour cela il faut configurer le fichier hosts (sur Windows il se trouve au chemin : `C:\Windows\System32\drivers\etc`) et y rajouter la ligne : `127.0.0.1 demo.res.ch`.

Maintenant il est possible d'accéder de faire nos requêtes sur le reverse proxy simplement un allant sur demo.res.ch  depuis le navigateur.

### 4. AJAX avec JQuery

