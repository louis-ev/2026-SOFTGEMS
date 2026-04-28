import Vue from "vue";
import VueRouter from "vue-router";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Accueil",
    component: () => import("@/views/SGHomeView.vue"),
  },
  {
    path: "/gems/new",
    name: "Create gem",
    component: () => import("@/views/GemNewView.vue"),
  },
  {
    path: "/gems",
    name: "Gems",
    component: () => import("@/views/GemsView.vue"),
    children: [
      {
        path: ":gem_id",
        name: "Open gem",
        component: () => import("@/views/GemOpenView.vue"),
        props: true,
      },
    ],
  },
  // {
  //   path: "/+:space_slug/:project_slug/publications/:publication_slug",
  //   alias: ["*/export.html"],
  //   name: "Publication",
  //   meta: {
  //     /* do not load full UI */
  //     static: true,
  //   },
  //   component: () => import("@/views/PublicationView.vue"),
  // },
  {
    path: "/@",
    name: "Tous les auteurs",
    component: () => import("@/views/AuthorsView.vue"),
  },
  {
    path: "/@:author_slug",
    name: "Auteur",
    component: () => import("@/views/AuthorView.vue"),
  },
  {
    path: "/_ui",
    name: "UI (dev only)",
    component: () => import("@/views/UIView.vue"),
  },
  // {
  //   // route to display a single media with caption/credits and
  //   // with qr scan option, and to generate preview for PDF and STL server-side
  //   path: "/_previewmedia",
  //   name: "Preview media",
  //   meta: {
  //     /* do not load full UI */
  //     static: true,
  //   },
  //   component: () => import("@/views/PreviewMedia.vue"),
  // },
  {
    path: "/reset-password",
    name: "Reset Password",
    component: () => import("@/views/ResetPasswordView.vue"),
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("@/views/NotFound.vue"),
  },
];

const router = new VueRouter({
  mode: "history",
  base: "/",
  routes,
  scrollBehavior(to, from, savedPosition) {
    const navigating_within_gems =
      to.path.startsWith("/gems") && from.path.startsWith("/gems");
    if (navigating_within_gems) return false;

    return new Promise((resolve, reject) => {
      // only if changing page and not just query or hash
      if (to.path !== from.path) {
        setTimeout(() => {
          if (savedPosition) {
            return resolve(savedPosition);
          } else {
            return resolve({ x: 0, y: 0 });
          }
        }, 150);
      }
    });
  },
});

export default router;
