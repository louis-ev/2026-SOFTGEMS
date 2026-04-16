import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    name: "MigrationWorkbench",
    component: () => import("@/views/MigrationWorkbenchView.vue"),
  },
  {
    path: "/navigation-test",
    name: "NavigationTestView",
    component: () => import("@/views/NavigationTestView.vue"),
  },
];

const router = createRouter({
  history: createWebHistory("/"),
  routes,
});

export default router;
