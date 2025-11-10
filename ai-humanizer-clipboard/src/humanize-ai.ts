import { Clipboard, showHUD } from "@raycast/api";

type ReplacementFunction = (match: string) => string;

export default async function main() {
  try {
    const text = await Clipboard.readText();
    if (!text) {
      await showHUD("Clipboard is empty");
      return;
    }

    const patterns: { regex: RegExp; replacement: string | ReplacementFunction }[] = [
      // Remove format characters (includes many invisible characters)
      { regex: /[\p{Cf}]/gu, replacement: "" },
      
      // Remove control characters
      { regex: /[\u000C\u001C]/g, replacement: "" }, // Form Feed, File Separator
      { regex: /\u000D(?!\u000A)/g, replacement: "" }, // Carriage Return (but keep CRLF)
      
      // Convert tab to 4 spaces
      { regex: /\u0009/g, replacement: "    " },
      
      // Special invisible character replacements (must come before general removal)
      { regex: /\u2062/g, replacement: "x" }, // Invisible Times → "x"
      { regex: /\u2063/g, replacement: "," }, // Invisible Separator → ","
      { regex: /\u2064/g, replacement: "+" }, // Invisible Plus → "+"
      
      // Remove zero-width characters (excluding U+2062, U+2063, U+2064 which are handled above)
      { regex: /[\u200B-\u200F\u202A-\u202E\u2060\u2061\u2065-\u206F]/g, replacement: "" },
      
      // Remove soft hyphen and grapheme joiner
      { regex: /[\u00AD\u034F]/g, replacement: "" },
      
      // Remove variation selectors (already covered by Cf, but explicit for clarity)
      { regex: /[\uFE00-\uFE0F]/g, replacement: "" },
      
      // Remove object replacement character
      { regex: /\uFFFC/g, replacement: "" },
      
      // Remove Zero-Width NBSP / BOM
      { regex: /\uFEFF/g, replacement: "" },
      
      // Remove Mongolian variation selectors
      { regex: /[\u180B-\u180D]/g, replacement: "" },
      
      // Remove Hangul and Khmer fillers
      { regex: /[\u115F\u1160\u17B4\u17B5]/g, replacement: "" },
      
      // Convert line/paragraph separators
      { regex: /\u2028/g, replacement: "\n" }, // Line Separator → \n
      { regex: /\u2029/g, replacement: "\n\n" }, // Paragraph Separator → \n\n
      
      // Convert various spaces to regular space
      { regex: /[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000\u2800\u3164\u180E\uFFA0]/g, replacement: " " },
      
      // Normalize dashes
      { regex: /[\u2010-\u2015\u2212]/g, replacement: "-" },
      { regex: /[\u2018\u2019\u2032\u2035\u2036\u201B\u201A\u201C\u201D]/g, replacement: (c: string) => {
        if (["\u2018", "\u2019", "\u2032", "\u2035", "\u2036", "\u201B", "\u201A"].includes(c)) {
          return "'";
        }
        if (["\u201C", "\u201D"].includes(c)) {
          return '"';
        }
        return c;
      } },
      { regex: /[\u00AB\u00BB]/g, replacement: '"' },
      {
        regex: /[\u2026\u2022\u00B7\uFF01-\uFF5E]/g,
        replacement: (c: string) =>
          c === "…" ? "..." : ["•", "·"].includes(c) ? "-" : String.fromCharCode(c.charCodeAt(0) - 0xfee0),
      },
      { regex: /[ \t]+\n/g, replacement: "\n" },
      { regex: /^[-*_]{3,}$/gm, replacement: "" },
      { regex: /[\u2E3A-\u2E3B]/g, replacement: "" },
      { regex: /\n{3,}/g, replacement: "\n\n" },
    ];

    let cleaned = text;
    patterns.forEach(({ regex, replacement }) => {
      if (typeof replacement === "string") {
        cleaned = cleaned.replace(regex, replacement);
      } else {
        cleaned = cleaned.replace(regex, replacement);
      }
    });

    await Clipboard.paste(cleaned);
    await showHUD("🧼 Text cleaned and copied");
  } catch (err) {
    await showHUD("❌ Error cleaning text");
    console.error(err);
  }
}
