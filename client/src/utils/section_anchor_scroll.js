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
