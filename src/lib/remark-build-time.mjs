// Replaces the literal token {{ build_time }} in markdown text with the
// build timestamp in Pacific Time, e.g. "16 March 2026 14:30".
// Used by the colophon (previously the Eleventy `dateNow` filter).

import { dateNow } from "./dates.mjs";

function visitText(node) {
  if (node.type === "text" && node.value.includes("{{ build_time }}")) {
    node.value = node.value.replaceAll("{{ build_time }}", dateNow());
  }
  if (node.children) node.children.forEach(visitText);
}

export default function remarkBuildTime() {
  return (tree) => visitText(tree);
}
