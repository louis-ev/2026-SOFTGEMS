import Vue from "vue";
import VueRouter from "vue-router";
import { isValidSelectionTypeSlug } from "@/utils/selection_type_registry.js";
import { isLegacySelectionFolderParam } from "@/utils/selection_urls.js";

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
        path: "legacy/:selection_path",
        name: "Selection legacy redirect",
        component: () => import("@/views/SGSelectionLegacyRedirectView.vue"),
        props: true,
      },
      {
        path: ":type_slug",
        beforeEnter(to, _from, next) {
          const type_slug = String(to.params.type_slug || "").trim();
          if (isValidSelectionTypeSlug(type_slug)) {
            next();
            return;
          }
          if (isLegacySelectionFolderParam(type_slug)) {
            next({
              name: "Selection legacy redirect",
              params: { selection_path: type_slug },
              replace: true,
            });
            return;
          }
          next({ path: "/selections", replace: true });
        },
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
            path: ":selection_path",
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
    if (to.hash) {
      return false;
    }

    const navigating_within_gems =
      to.path.startsWith("/gems") && from.path.startsWith("/gems");
    const navigating_within_address_book =
      to.path.startsWith("/address-book") &&
      from.path.startsWith("/address-book");
    const navigating_within_selections =
      to.path.startsWith("/selections") &&
      from.path.startsWith("/selections");
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
