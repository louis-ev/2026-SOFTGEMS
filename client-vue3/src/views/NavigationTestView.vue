<template>
  <section class="navigation_test">
    <h2>Navigation test view</h2>
    <p>
      Cette vue sert a verifier que la navigation par URL fonctionne bien avec
      Vue Router 4.
    </p>

    <p class="route_info">URL actuelle: <code>{{ route_path }}</code></p>

    <RouterLink to="/" class="nav_link">Retour a la page principale</RouterLink>
  </section>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const route_path = computed(() => route.path);
</script>

<style scoped>
.navigation_test h2 {
  margin-top: 0;
}

.route_info {
  margin-top: 1rem;
}

.nav_link {
  display: inline-flex;
  margin-top: 0.5rem;
}
</style>
