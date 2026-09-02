import { useEffect } from "react";

/**
 * Adds `is-seen` to every `.landing-rise` element once it scrolls into view.
 * Shared by the public marketing pages so their reveal animations behave the
 * same way. The `-12%` bottom margin means an element only counts as seen once
 * it is comfortably on screen, so the animation plays where it can be watched.
 */
export function useRevealOnScroll() {
  useEffect(() => {
    const reveal = new IntersectionObserver(
      (entries, observer) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-seen");
          observer.unobserve(entry.target);
        }),
      { threshold: 0.01, rootMargin: "0px 0px -12% 0px" },
    );

    const observe = (root: ParentNode) => {
      if (
        root instanceof Element &&
        root.classList.contains("landing-rise") &&
        !root.classList.contains("is-seen")
      ) {
        reveal.observe(root);
      }
      root
        .querySelectorAll?.(".landing-rise:not(.is-seen)")
        .forEach((element) => reveal.observe(element));
    };

    observe(document);

    // Catch `.landing-rise` nodes added later (async course / tutor / FAQ lists,
    // the hero carousel swapping headings, etc.).
    const mutations = new MutationObserver((records) =>
      records.forEach((record) =>
        record.addedNodes.forEach((node) => {
          if (node.nodeType === 1) observe(node as Element);
        }),
      ),
    );
    mutations.observe(document.querySelector("main") ?? document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      reveal.disconnect();
      mutations.disconnect();
    };
  }, []);
}

/**
 * Renders text word by word so it can be "written" onto the screen. The wrapper
 * carries `landing-rise`, so the reveal observer marks it seen and the per-word
 * CSS animation runs. Whitespace is kept as-is for natural wrapping.
 */
export function Written({
  text,
  as: Tag = "span",
  className = "",
}: {
  text: string;
  as?: "span" | "p";
  className?: string;
}) {
  let wordIndex = 0;
  return (
    <Tag className={`landing-written landing-rise ${className}`.trim()}>
      {text.split(/(\s+)/).map((part, index) =>
        part.trim() === "" ? (
          part
        ) : (
          <span
            key={index}
            style={{ "--wi": wordIndex++ } as React.CSSProperties}
          >
            {part}
          </span>
        ),
      )}
    </Tag>
  );
}
