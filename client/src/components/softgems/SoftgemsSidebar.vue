<template>
  <nav class="_softgemsSidebar" aria-label="Main navigation">
    <router-link
      to="/"
      class="_navItem"
      :class="{ 'is--active': $route.path === '/' }"
      title="Home"
    >
      <BIconHouse />
    </router-link>
    <router-link
      to="/gems"
      class="_navItem"
      :class="{ 'is--active': $route.path.startsWith('/gems') }"
      title="Gems"
    >
      <BIconGem />
    </router-link>
    <router-link
      to="/selections"
      class="_navItem"
      :class="{ 'is--active': $route.path.startsWith('/selections') }"
      title="Selections"
    >
      <BIconCardList />
    </router-link>
    <router-link
      to="/contact"
      class="_navItem"
      :class="{ 'is--active': $route.path.startsWith('/contact') }"
      title="Contact"
    >
      <BIconPeople />
    </router-link>
  </nav>
</template>

<script>
export default {
  name: "SoftgemsSidebar",
};
</script>

<style lang="scss" scoped>
._softgemsSidebar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(var(--spacing) / 2);
  padding: calc(var(--spacing) * 1);
  background: var(--c-vert);
  z-index: 3;
}

._navItem {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  transition: background-color 150ms ease, color 150ms ease;
}

._navItem:hover {
  background: rgba(255, 255, 255, 0.14);
}

._navItem.is--active {
  background: #ffffff;
  color: #111;
}
</style>
