<template>
  <section class="workbench">
    <h2>Migration workbench</h2>
    <p>
      Ce client Vue 3 est volontairement minimal. Il sert de base pour migrer
      progressivement le socle (`api`, `router`, services partages) puis les
      composants metier.
    </p>

    <ul>
      <li>Etape 1: stabiliser le boot Vue 3.</li>
      <li>Etape 2: extraire une couche API independante de Vue 2.</li>
      <li>Etape 3: migrer un premier ecran pilote.</li>
    </ul>

    <p class="route_info">URL actuelle: <code>{{ route_path }}</code></p>

    <RouterLink to="/navigation-test" class="nav_link">
      Aller a la vue de test navigation
    </RouterLink>
  </section>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const route_path = computed(() => route.path);
</script>

<style scoped>
.workbench h2 {
  margin-top: 0;
}

.workbench p {
  max-width: 70ch;
}

.route_info {
  margin-top: 1rem;
}

.nav_link {
  display: inline-flex;
  margin-top: 0.5rem;
}
</style>
