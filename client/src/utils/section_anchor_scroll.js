export function getRouteSectionHash(route) {
  const hash =
    route?.hash ||
    (typeof window !== "undefined" ? window.location.hash : "");
  return String(hash).replace(/^#/, "").trim();
}

export function findScrollParent(element) {
  if (!element) return null;
  let el = element.parentElement;
  while (el) {
    const style = window.getComputedStyle(el);
    const overflow_y = style.overflowY;
    if (
      /(auto|scroll|overlay)/i.test(overflow_y) &&
      el.scrollHeight > el.clientHeight + 1
    ) {
      return el;
    }
    el = el.parentElement;
  }
  return null;
}

/**
 * Scroll so `element`'s top sits at a fraction of the viewport height from the top
 * (e.g. 1/3 → panel top one-third down the screen).
 */
export function scrollElementToViewportFraction(
  element,
  { viewport_fraction_from_top = 1 / 3, smooth = false } = {}
) {
  if (!element || typeof element.getBoundingClientRect !== "function") {
    return false;
  }

  if (typeof window === "undefined") return false;

  const behavior = smooth ? "smooth" : "auto";
  const target_viewport_top = window.innerHeight * viewport_fraction_from_top;
  const element_rect = element.getBoundingClientRect();
  const scroll_delta = element_rect.top - target_viewport_top;

  if (Math.abs(scroll_delta) < 1) return true;

  const scroll_parent = findScrollParent(element);
  if (scroll_parent) {
    scroll_parent.scrollTo({
      top: scroll_parent.scrollTop + scroll_delta,
      behavior,
    });
  } else {
    window.scrollBy({ top: scroll_delta, behavior });
  }
  return true;
}

export function scrollElementToAnchor(element, { smooth = false } = {}) {
  if (!element || typeof element.getBoundingClientRect !== "function") {
    return false;
  }

  const behavior = smooth ? "smooth" : "auto";
  const scroll_parent = findScrollParent(element);

  if (!scroll_parent) {
    element.scrollIntoView({ behavior, block: "start" });
    return true;
  }

  const scroll_margin_top =
    parseFloat(window.getComputedStyle(element).scrollMarginTop) || 0;
  const element_rect = element.getBoundingClientRect();
  const parent_rect = scroll_parent.getBoundingClientRect();
  const target_top =
    scroll_parent.scrollTop +
    element_rect.top -
    parent_rect.top -
    scroll_margin_top;

  scroll_parent.scrollTo({
    top: Math.max(0, target_top),
    behavior,
  });
  return true;
}

let pending_cancel = null;

export function scheduleSectionAnchorScroll(
  element,
  {
    route,
    section_id,
    smooth = false,
    retry_delays_ms = [0, 50, 150, 350, 650, 1000],
  } = {}
) {
  if (pending_cancel) {
    pending_cancel();
    pending_cancel = null;
  }

  if (!element || !section_id) return () => {};

  const timeouts = [];
  const expected_key = () => {
    const hash = getRouteSectionHash(route);
    if (!hash || hash !== section_id) return "";
    return `${route?.path || ""}#${hash}`;
  };

  retry_delays_ms.forEach((delay, index) => {
    const timeout_id = window.setTimeout(() => {
      if (!expected_key()) return;
      scrollElementToAnchor(element, {
        smooth: smooth && index > 0,
      });
    }, delay);
    timeouts.push(timeout_id);
  });

  const cancel = () => {
    timeouts.forEach((id) => window.clearTimeout(id));
  };
  pending_cancel = cancel;
  return cancel;
}

export function findSectionAnchorElement({ route, root_el, section_id }) {
  const hash = section_id || getRouteSectionHash(route);
  if (!hash) return null;

  if (root_el && typeof root_el.querySelector === "function") {
    const scoped = root_el.querySelector(`#${hash}`);
    if (scoped) return scoped;
  }

  if (typeof document !== "undefined") {
    return document.getElementById(hash);
  }

  return null;
}

export function scrollToRouteSectionFromRoot({
  route,
  root_el,
  smooth = false,
} = {}) {
  const hash = getRouteSectionHash(route);
  if (!hash) return () => {};

  const element = findSectionAnchorElement({ route, root_el, section_id: hash });
  if (!element) return () => {};

  return scheduleSectionAnchorScroll(element, {
    route,
    section_id: hash,
    smooth,
  });
}
