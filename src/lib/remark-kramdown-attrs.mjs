// Kramdown-style inline attribute lists, e.g. ![alt](src){:style="..."}.
// Replaces markdown-it-attrs (with {: } delimiters) from the Eleventy setup.
//
// Supported forms (the ones used in this site's content):
//   1. {:...} immediately after an inline element applies to that element:
//        ![alt](/img.jpeg){:style="width: 32%;"}
//   2. {:...} alone on the last line of a paragraph applies to the paragraph:
//        ![a](/1.jpeg)
//        ![b](/2.jpeg)
//        {:style="width: 100%; text-align: center;"}
//   3. A paragraph consisting solely of {:...} applies to the previous block:
//        # Heading
//        {:style="text-align:center;"}

const ATTR_RE = /^\{:([^}]*)\}/;

function parseAttrs(body) {
  const props = {};
  // key="value" pairs
  for (const m of body.matchAll(/([a-zA-Z_:][\w:.-]*)="([^"]*)"/g)) {
    props[m[1]] = m[2];
  }
  // .class and #id shorthands
  const rest = body.replace(/([a-zA-Z_:][\w:.-]*)="[^"]*"/g, "");
  const classes = [...rest.matchAll(/\.([\w-]+)/g)].map((m) => m[1]);
  if (classes.length) props.class = classes.join(" ");
  const id = rest.match(/#([\w-]+)/);
  if (id) props.id = id[1];
  return props;
}

function applyProps(node, props) {
  node.data = node.data || {};
  node.data.hProperties = { ...node.data.hProperties, ...props };
}

function processParent(parent) {
  const children = parent.children;

  // Form 1: text node starting with {:...} right after an inline element
  for (let i = 1; i < children.length; i++) {
    const node = children[i];
    if (node.type !== "text") continue;
    const match = node.value.match(ATTR_RE);
    if (!match) continue;
    const target = children[i - 1];
    if (target.type === "text") continue;
    applyProps(target, parseAttrs(match[1]));
    node.value = node.value.slice(match[0].length);
  }

  // Form 2: {:...} alone on the paragraph's last line applies to the paragraph
  const last = children[children.length - 1];
  if (last && last.type === "text") {
    const match = last.value.match(/(^|\n)\{:([^}]*)\}\s*$/);
    if (match) {
      applyProps(parent, parseAttrs(match[2]));
      last.value = last.value.slice(0, last.value.length - match[0].length);
    }
  }

  // Drop text nodes emptied by the rewrites above
  parent.children = children.filter((n) => n.type !== "text" || n.value !== "");
}

export default function remarkKramdownAttrs() {
  return (tree) => {
    const blocks = tree.children;
    for (let i = blocks.length - 1; i >= 0; i--) {
      const block = blocks[i];
      // Form 3: paragraph that is only {:...} applies to the previous block
      if (
        i > 0 &&
        block.type === "paragraph" &&
        block.children.length === 1 &&
        block.children[0].type === "text"
      ) {
        const match = block.children[0].value.match(/^\{:([^}]*)\}\s*$/);
        if (match) {
          applyProps(blocks[i - 1], parseAttrs(match[1]));
          blocks.splice(i, 1);
          continue;
        }
      }
      if (block.type === "paragraph" || block.type === "heading") {
        processParent(block);
      }
    }
  };
}
