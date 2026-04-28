<template>
  <nav class="_softgemsSidebar" aria-label="Main navigation">
    <router-link
      v-for="nav_item in nav_items"
      :key="nav_item.to"
      :to="nav_item.to"
      class="u-button u-button_icon _navItem"
      :class="{ 'is--active': isNavItemActive(nav_item) }"
      :title="nav_item.title"
    >
      <b-icon :icon="nav_item.icon" />
    </router-link>
  </nav>
</template>

<script>
export default {
  name: "SoftgemsSidebar",
  data() {
    return {
      nav_items: [
        { to: "/", title: "Home", icon: "house", match_type: "exact" },
        { to: "/gems", title: "Gems", icon: "gem", match_type: "starts_with" },
        {
          to: "/selections",
          title: "Selections",
          icon: "card-list",
          match_type: "starts_with",
        },
        {
          to: "/contact",
          title: "Contact",
          icon: "people",
          match_type: "starts_with",
        },
      ],
    };
  },
  methods: {
    isNavItemActive(nav_item) {
      if (nav_item.match_type === "exact")
        return this.$route.path === nav_item.to;
      return this.$route.path.startsWith(nav_item.to);
    },
  },
};
</script>

<style lang="scss" scoped>
._softgemsSidebar {
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
