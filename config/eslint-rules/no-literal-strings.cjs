/**
 * Simple rule to discourage hardcoded strings in JSX.
 */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow hardcoded literal strings in JSX (use i18n/dictionaries)",
    },
    schema: [
      {
        type: "object",
        properties: {
          allowAttributes: { type: "array", items: { type: "string" } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      noJSXText: "Avoid hardcoded JSX text: move to dictionary (i18n)",
      noAttrLiteral:
        "Avoid hardcoded string for '{{name}}': move to dictionary (i18n)",
    },
  },
  create(context) {
    const options = (context.options && context.options[0]) || {};
    const allowAttributes = new Set(
      options.allowAttributes || [
        "className",
        "id",
        "href",
        "src",
        "role",
        "data-testid",
        "viewBox",
        "fill",
        "stroke",
        "d",
        "width",
        "height",
        "x",
        "y",
        "cx",
        "cy",
        "r",
        "type",
        "name",
        "value",
        "placeholderKey",
      ],
    );

    function isInsideDictionary(fileName) {
      return /app\/\[lang\]\/dictionaries\//.test(fileName);
    }

    const filename = context.getFilename();
    const skip =
      isInsideDictionary(filename) ||
      /tests\//.test(filename) ||
      /playwright\//.test(filename);
    if (skip) return {};

    return {
      JSXText(node) {
        const text = node.value.replace(/\u00A0/g, " ").trim();
        if (!text) return;
        if (/^[\p{P}\p{S}]+$/u.test(text)) return;
        context.report({ node, messageId: "noJSXText" });
      },
      JSXAttribute(node) {
        const name = node.name && node.name.name;
        if (!name || allowAttributes.has(String(name))) return;
        const val = node.value;
        if (val && val.type === "Literal" && typeof val.value === "string") {
          const text = String(val.value).trim();
          if (!text) return;
          context.report({
            node: val,
            messageId: "noAttrLiteral",
            data: { name: String(name) },
          });
        }
      },
    };
  },
};
