# client-vue3

Ce dossier heberge le nouveau client Vue 3 de do•doc.

## Objectif

Remplacer le client Vue 2 par un client Vue 3.

## Scripts

- `npm run dev --prefix client-vue3`
- `npm run build --prefix client-vue3`
- `npm run preview --prefix client-vue3`

## Integration dans do•doc

- En mode build: `/_client/build.js` est servi par le backend.
- En livereload: `https://localhost:5178/src/main.js`.

## Strategie de migration

1. Migrer d’abord le socle technique dans `client-vue3`:
   - couche API non dependante de `Vue.prototype`
   - router Vue 3
   - services transverses (i18n, event bus, notifications)
2. Migrer ensuite les ecrans/composants, un flux metier a la fois.
