<template>
  <div class="app_shell">
    <header class="app_header">
      <h1>SoftGems - client Vue 3</h1>
      <p>Espace de migration progressive depuis le client Vue 2.</p>
    </header>

    <main class="app_main">
      <RouterView />
    </main>
  </div>
</template>

<script setup></script>

<style scoped>
.app_shell {
  min-height: 100vh;
  padding: 1.5rem;
}

.app_header {
  margin-bottom: 1rem;
}

.app_header h1 {
  margin: 0;
}

.app_header p {
  margin: 0.35rem 0 0;
}

.app_main {
  border: 1px solid #e4e4e4;
  border-radius: 0.5rem;
  padding: 1rem;
  background: #fff;
}
</style>
