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

