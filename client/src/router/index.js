import Vue from "vue";
import VueRouter from "vue-router";
import {
  isSelectionAppPath,
  redirectShortSelectionPath,
  validateSelectionTypeRoute,
} from "@/utils/selection_urls.js";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Accueil",
    component: () => import("@/views/SGHomeView.vue"),
  },
  {
    path: "/gems",
    name: "Gems",
    component: () => import("@/views/SGGemsView.vue"),
    children: [
      {
        path: "new",
        name: "Create gem",
        component: () => import("@/views/SGGemNewView.vue"),
      },
      {
        path: ":gem_id",
        name: "Open gem",
        component: () => import("@/views/SGGemOpenView.vue"),
        props: true,
      },
    ],
  },
  {
    path: "/contact",
    redirect: "/address-book",
  },
  {
    path: "/contacts",
    redirect: "/address-book",
  },
  {
    path: "/address-book",
    name: "Address book",
    component: () => import("@/views/SGAddressBookView.vue"),
    children: [
      {
        path: "new",
        name: "Create contact",
        component: () => import("@/views/SGContactNewView.vue"),
      },
      {
        path: ":contact_slug",
        name: "Open contact",
        component: () => import("@/views/SGContactOpenView.vue"),
        props: true,
      },
    ],
  },
  {
    path: "/selections",
    component: () => import("@/layouts/SGSelectionsLayout.vue"),
    children: [
      {
        path: "",
        name: "Selections hub",
        component: () => import("@/views/SGSelectionsHubView.vue"),
      },
      {
        path: ":type_slug",
        beforeEnter: validateSelectionTypeRoute,
        component: () => import("@/views/SGSelectionsView.vue"),
        props: (route) => ({
          type_slug: route.params.type_slug,
        }),
        children: [
          {
            path: "new",
            name: "Create selection",
            component: () => import("@/views/SGSelectionNewView.vue"),
            props: (route) => ({
              type_slug: route.params.type_slug,
            }),
          },
          {
            path: ":selection_path(\\d+)",
            name: "Open selection",
            component: () => import("@/views/SGSelectionOpenView.vue"),
            props: (route) => ({
              type_slug: route.params.type_slug,
              selection_path: route.params.selection_path,
            }),
          },
        ],
      },
    ],
  },
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
  {
    path: "/reset-password",
    name: "Reset Password",
    meta: {
      auth_exempt: true,
    },
    component: () => import("@/views/ResetPasswordView.vue"),
  },
  {
    path: "/:type_slug/:rest(.*)",
    redirect: redirectShortSelectionPath,
  },
  {
    path: "/:type_slug",
    redirect: redirectShortSelectionPath,
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
    if (to.hash) {
      return false;
    }

    const navigating_within_gems =
      to.path.startsWith("/gems") && from.path.startsWith("/gems");
    const navigating_within_address_book =
      to.path.startsWith("/address-book") &&
      from.path.startsWith("/address-book");
    const navigating_within_selections =
      isSelectionAppPath(to.path) && isSelectionAppPath(from.path);
    if (
      navigating_within_gems ||
      navigating_within_address_book ||
      navigating_within_selections
    ) {
      return false;
    }

    if (to.path === from.path) {
      return false;
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        if (savedPosition) {
          resolve(savedPosition);
        } else {
          resolve({ x: 0, y: 0 });
        }
      }, 150);
    });
  },
});

export default router;
