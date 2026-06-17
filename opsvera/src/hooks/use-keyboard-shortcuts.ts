"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.getAttribute("contenteditable") === "true"
      ) {
        return;
      }

      // Check if command/ctrl key is pressed
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // Handle sequence shortcuts
      let sequenceTimeout: NodeJS.Timeout;
      const handleSequence = (key: string) => {
        const nextKeyHandler = (e2: KeyboardEvent) => {
          document.removeEventListener("keydown", nextKeyHandler);
          clearTimeout(sequenceTimeout);

          if (key === "g") {
            switch (e2.key) {
              case "d": router.push("/dashboard"); break;
              case "p": router.push("/products"); break;
              case "i": router.push("/inventory/stock"); break;
              case "s": router.push("/sales"); break;
            }
          }
        };

        document.addEventListener("keydown", nextKeyHandler);
        sequenceTimeout = setTimeout(() => {
          document.removeEventListener("keydown", nextKeyHandler);
        }, 1000); // Wait up to 1s for the second key
      };

      switch (e.key) {
        case "n":
          // Context-aware "new" based on path
          const path = window.location.pathname;
          if (path.startsWith("/products")) router.push("/products/new");
          else if (path.startsWith("/sales")) router.push("/sales/new");
          else if (path.startsWith("/purchases")) router.push("/purchases/new");
          else router.push("/products/new"); // default
          break;
        case "g":
          handleSequence("g");
          break;
        case "/":
          // Focus search/filter input if exists
          e.preventDefault();
          const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
          if (searchInput) searchInput.focus();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [router]);
}
