import "server-only";
import sanitizeHtmlLib from "sanitize-html";

// Очистка HTML из CMS (wysiwyg) перед dangerouslySetInnerHTML.
// Контент вводит администратор, но санитизация — защита от случайного/вредного разметки.
export function sanitizeCmsHtml(html: string | null | undefined): string {
  if (!html) return "";
  return sanitizeHtmlLib(html, {
    allowedTags: [
      "p", "br", "strong", "b", "em", "i", "u", "s",
      "ul", "ol", "li", "blockquote",
      "h2", "h3", "h4", "a", "span", "hr",
      "table", "thead", "tbody", "tr", "th", "td",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      span: ["style"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      a: sanitizeHtmlLib.simpleTransform("a", { rel: "noopener noreferrer" }),
    },
  });
}
