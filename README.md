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

on commence par initialiser un projet node.js avec :

```bash
npm init
```

puis installer la dépendance node.js *chance* avec :

```bash
npm install --save chance
```

qui va créer une entrée "dependance" dans package.json ainsi qu'un dossier node_module

on créer notre fichier index.js et on y fait un simple programme qui affiche un nom aléatoire avec *chance* :

```javascript
var Chance = require('chance')
var chance = new Chance();

console.log("Bonjour " + chance.name());
```

et on l'exécute dans le terminal avec :

```bash
node index.js
```

on va ensuite tester l'exécution du script dans le container docker :

```bash
docker build -t res/node_express .

docker run res/node_express
```

cela va afficher le même résultat que l'étape précédente mais depuis le container

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

-  les end-points `/` et `/students` pour les requêtes GET :

```javascript
app.get('/students', function(req, res) {
    res.send(generateStudents());
});

app.get('/', function(req, res) {
    res.send("Hello, this endpoint is empty, try /students");
});
```

- la fonction express qui va permettre au serveur d'écouter sur le port 3000 :

```javascript
app.listen(3000, function() {
    console.log("Accepting HTTP requests on port 3000.");
});
```

- la fonction `generateStudents()`utilise la dépendance *chance* pour créer un tableau d'élèves aléatoire :

```javascript
var Chance = require('chance');
var chance = new Chance();

function generateStudents() {
  var numberOfStudents = chance.integer({
    min: 0,
    max: 10,
  });
  console.log(numberOfStudents);
  var students = [];
  for (var i = 0; i < numberOfStudents; i++) {
    var gender = chance.gender();
    var birthYear = chance.year({
      min: 1986,
      max: 1996,
    });
    students.push({
      firstName: chance.first({
        gender: gender,
      }),
      lastName: chance.last(),
      gender: gender,
      birthday: chance.birthday({
          year: birthYear
      })
    });
  };
  console.log(students);
  return students;
}
```

*Note* : le end-point `/` doit se trouver après le `/student` sinon il sera toujours pris.

