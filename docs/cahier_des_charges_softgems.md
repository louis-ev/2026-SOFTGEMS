# Cahier des charges – Application SoftGems

## 1. Contexte et objectif

Le projet SoftGems (nom de projet, sujet à évolution) vise à concevoir et développer une application web de gestion interne destinée à la traçabilité, la consultation et la gestion d’un inventaire de pierres précieuses.

L’application doit permettre :

- la création, la modification, la recherche et le suivi de fiches de pierres ;
- l’importation de données ;
- la gestion d’un historique complet des opérations ;
- la gestion de sélections de pierres ;
- la production de PDF ;
- la tenue d’un carnet d’adresses partagé pour l’ensemble des contacts de l’entreprise.

L’objectif est de disposer d’un outil ergonomique, fiable et centralisé, accessible via navigateur, pour une dizaine d’utilisateurs internes, sur une base de 1 000 à 10 000 enregistrements environ.

Le développement se déroule en deux étapes :

- Version alpha : toutes les fonctionnalités de base pour constituer l’inventaire.
- Version finale : ensemble des fonctionnalités, stabilisations et retours utilisateurs.

## 2. Périmètre fonctionnel (version 1)

### 2.1 Authentification et accès

- Système de comptes utilisateurs locaux (login et mot de passe).
- Gestion basique des rôles (administrateur et utilisateur standard).
- Protection des routes et sessions sécurisées (JWT ou équivalent).
- Interface de connexion et de réinitialisation de mot de passe.
- Gestion des utilisateurs par un administrateur (création, modification, suppression de comptes).

### 2.2 Tableau de bord

- Vue d’ensemble de l’activité récente : dernières modifications, nombre total de pierres, alertes éventuelles.
- Liste complète du stock de pierres dans un tableau avec plusieurs méthodes de visualisation et une recherche croisée.
- Accès rapide aux sélections (comprenant les sélections simples, boîtes, dernières pierres ajoutées).

### 2.3 Gestion des pierres

- Création, édition et suppression de fiches de pierres.
- Champs principaux : identifiant unique, statut, couleur, lieu d’origine, dimensions, type, poids, nombre de pièces, état, treatment, prix d’achat, prix de vente, prix au carat, fournisseur, date d’acquisition, COC (Country of cut), autres remarques/commentaires.
- Possibilité d’associer un ou plusieurs fichiers par fiche (formats PDF, JPG, PNG, HEIC, vidéo MP4).
- Possibilité d’associer une pierre à une autre en “pair”, en renseignant l’ID.
- Importation directe des fichiers vers un volume de stockage local sur le serveur (limite totale de 100 Go, augmentable si nécessaire).
- Affichage des fichiers liés avec aperçu, légende personnalisable et option de suppression.
- Possibilité de définir une image de couverture pour chaque pierre, utilisée dans la vue d’ensemble pour les identifier plus facilement.
- Tous les montants sont exprimés en dollars américains (USD).
- Le module de duplication, fusion ou division (split/merge) permet :
  - de scinder une fiche en plusieurs éléments en mettant à jour certaines métadonnées (nombre, poids, prix d’achat) ;
  - de conserver la filiation avec la pierre d’origine ;
  - de fusionner vers la pierre originale en réintégrant les métadonnées ;
  - de réaliser plusieurs split successifs sur un même lot de pierres.

### 2.4 Gestion des sélections

- Création, édition et suppression de sélections.
- Les sélections doivent être d’un type issu de la liste suivante :
  - sélection simple
  - boîte
  - memo in
  - return memo in
  - buying invoice
  - memo out
  - return memo out
  - sale invoice
  - credit note
  - importation
  - importation return
- Chaque type comporte un certain nombre de champs associés : date, nom de client, numéro de commande, currency, etc.
- Une sélection peut contenir un ou plusieurs fichiers liés (PDF, photos, autre).
- Un menu permet de sélectionner les pierres faisant partie de la sélection.
- Un autre menu est disponible sur la fiche d’une pierre pour indiquer la sélection dont doit faire partie la pierre (par exemple, la sélection/boîte dans laquelle elle se trouve).

### 2.5 Recherche et filtrage

- Barre de recherche globale sur plusieurs champs (nom, référence, fournisseur, type).
- Filtres dynamiques (type, statut, fourchette de prix, poids, date d’acquisition).
- Tri personnalisable sur les principales colonnes.
- Affichage des résultats sous forme de liste paginée avec aperçu rapide.
- Actions par lot : sélection/suppression de tous les résultats d’une recherche, édition groupée d’un champ spécifique.

### 2.6 Historique et audit

- Enregistrement automatique de toutes les modifications effectuées sur chaque fiche (création, mise à jour, suppression).
- Détail des modifications : date, utilisateur, champs modifiés et anciennes valeurs.
- Historique consultable depuis l’interface de chaque fiche.

### 2.7 Importation de données

- Import massif à partir d’un fichier CSV (structure définie dans la documentation).
- Vérification basique du format avant import (correspondance des champs obligatoires).
- Enregistrement automatique des lignes valides.
- Rejet des lignes erronées avec message explicatif.
- Option de prévisualisation avant validation définitive.

### 2.8 Exportation

- Export des listes de pierres filtrées ou complètes au format CSV.
- Export de l’historique des opérations.
- Création de PDF à partir d’une sélection de pierres, reprenant :
  - les métadonnées liées à la sélection ;
  - certaines métadonnées liées aux pierres sous forme de tableau.
- L’entête du PDF peut être rédigé ou pré-rempli avec les coordonnées d’un contact (voir fonctionnalité Contacts).
- Le tableau du contenu d’une sélection peut également être copié vers un email.

### 2.9 Contacts

- Un répertoire de contacts est mis en place en parallèle de l’inventaire des pierres et des sélections.
- Il permet de référencer d’autres structures avec les informations suivantes : nom, adresse postale, téléphone, adresse mail, numéro de TVA, RIB.
- Chaque structure comporte également une liste de personnes avec les informations suivantes : nom, prénom, mail, adresse postale, téléphone.
- Un contact peut être mentionné dans un export PDF, comme destinataire.

## 3. Architecture et choix techniques

### 3.1 Technologies principales

- Front-end : Vue.js avec Vite.
- Back-end : Node.js (framework léger de type Express).
- Stockage fichiers : volume monté localement sur le serveur (100 Go alloués).
- Langage et format : UTF-8, interfaces et données en anglais.
- Hébergement : VPS localisé en France, géré par le prestataire, avec sauvegarde automatisée quotidienne.

### 3.2 Sécurité et conformité

- Communication chiffrée via HTTPS.
- Mots de passe stockés sous forme hashée.
- Sauvegardes automatiques des données et des fichiers.
- Respect des principes de base du RGPD : aucune donnée sensible, possibilité de suppression sur demande, stockage en France.
- Accès restreint par un premier mot de passe limitant l’accès.

## 4. Interface utilisateur (UX / UI)

- Interface épurée, adaptée aux écrans d’ordinateur, tablette et mobile.
- Interface en anglais, avec annotations et explications directement dans l’interface.
- Design responsive et clair, privilégiant la lisibilité des données.
- Navigation principale par barre latérale et panneaux côte à côte pour comparer/copier des informations.
- Interface de saisie fluide avec validations immédiates (poids, prix, champs obligatoires).
- Aperçu d’image intégré dans les formulaires.
- Comportement fluide et réactif, avec mise à jour des données en temps réel sans rechargement de page.

## 5. Sauvegardes, maintenance et hébergement

- Hébergement sur un VPS dédié localisé en France.
- Sauvegarde complète des données et des fichiers médias tous les jours, avec rétention sur 7 jours minimum.
- Possibilité de restauration en cas d’incident.
- Surveillance basique du volume de stockage et du fonctionnement du serveur.
- Mise à jour régulière pour assurer la disponibilité et la protection contre la plupart des attaques.

## 6. Livrables

- Code source complet du front-end et du back-end sur le serveur d’hébergement.
- Schéma de la base de données.
- Documentation technique minimale (installation, déploiement, sauvegarde).
- Interface fonctionnelle prête à l’emploi, installée sur le VPS fourni.

## 7. Planning prévisionnel

- 4 semaines après la signature du devis et le début de mission : livraison de la version alpha (fonctionnelle, non stabilisée).
- 4 semaines après la livraison de la version alpha : livraison de la version finale stabilisée, avec correctifs et documentation.

Des ajustements mineurs peuvent être planifiés après la mise en production, dans le cadre d’une maintenance évolutive.

## 8. Points à définir et exclusions

Certains points nécessitent une définition ultérieure ou ne font pas partie du périmètre immédiat :

- Gestion avancée de la sécurité (2FA, restrictions IP, journalisation complète).

## 9. Objectif global

La plate-forme SoftGems a pour finalité de fournir un outil interne de gestion de pierres stable, rapide et simple d’utilisation, permettant le suivi complet des stocks et des opérations, tout en conservant une architecture évolutive.
