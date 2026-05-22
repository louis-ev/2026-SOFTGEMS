<template>
  <SGIconSidebarNav
    aria_label="Main navigation"
    variant="primary"
    :items="sidebar_items"
  />
</template>

<script>
import SGIconSidebarNav from "@/components/softgems/SGIconSidebarNav.vue";

export default {
  name: "SoftgemsSidebar",
  components: {
    SGIconSidebarNav,
  },
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
          to: "/address-book",
          title: "Address book",
          icon: "people",
          match_type: "starts_with",
        },
      ],
    };
  },
  computed: {
    sidebar_items() {
      return this.nav_items.map((nav_item) => ({
        key: nav_item.to,
        to: nav_item.to,
        title: nav_item.title,
        icon: nav_item.icon,
        active: this.isNavItemActive(nav_item),
      }));
    },
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
