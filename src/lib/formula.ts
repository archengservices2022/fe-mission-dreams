import katex from "katex";

const GREEK_LETTERS = [
  "alpha", "beta", "gamma", "delta", "epsilon", "zeta", "eta", "theta", "iota", "kappa",
  "lambda", "mu", "nu", "xi", "pi", "rho", "sigma", "tau", "upsilon", "phi", "chi", "psi", "omega",
];

function wrapMultiCharSupSub(latex: string): string {
  return latex.replace(/([\^_])([A-Za-z0-9]{2,}|\([^()]*\))/g, (_match, marker: string, body: string) => {
    const clean = body.startsWith("(") ? body.slice(1, -1) : body;
    return `${marker}{${clean}}`;
  });
}

function wrapSimpleFraction(latex: string): string {
  return latex.replace(
    /(?<![_A-Za-z0-9])([A-Za-z0-9\\]+(?:_\{[^{}]+\})?)\s*\/\s*([A-Za-z0-9\\]+(?:_\{[^{}]+\})?)(?![_A-Za-z0-9])/g,
    (match, num: string, den: string) => `\\frac{${num}}{${den}}`,
  );
}

export function toLatex(raw: string): string {
  let latex = raw.trim();

  // Literal "%" and "$" are reserved LaTeX characters — "%" starts a comment that silently
  // truncates everything after it, and "$" toggles math mode. Escape both before anything else.
  latex = latex.replace(/(?<!\\)%/g, "\\%");
  latex = latex.replace(/(?<!\\)\$/g, () => "\\$");

  GREEK_LETTERS.forEach((name) => {
    latex = latex.replace(new RegExp(`\\b${name}\\b`, "gi"), `\\${name}`);
  });

  // Trig/log names read as function operators, whether followed by parens ("cos(C)") or a
  // Greek letter with no space ("cosθ"). Latin-letter lookahead is intentionally excluded —
  // it would misfire on ordinary words like "Cost" that happen to start with "cos".
  latex = latex.replace(/\b(sin|cos|tan|cot|sec|csc|log|ln)(?=\(|[Α-Ωα-ω])/gi, "\\$1");

  // A single letter (or Greek macro) immediately followed by one digit reads as a subscript
  // in this content's convention ("v0" meaning v₀), as long as it isn't part of a longer token.
  latex = latex.replace(/(\\[a-zA-Z]+|[A-Za-zΑ-Ωα-ω])(\d)(?![A-Za-z\d])/g, "$1_{$2}");

  latex = wrapMultiCharSupSub(latex);
  latex = wrapSimpleFraction(latex);

  // Deferred until after fraction-wrapping: these all produce a bare "{argument}" with no
  // leading "_", which wrapSimpleFraction's token matcher doesn't know how to include, so
  // running them earlier left a dangling "}" whenever the result sat next to a "/".
  latex = latex.replace(/\bsqrt\(([^()]*)\)/gi, "\\sqrt{$1}");
  latex = latex.replace(/√\(([^()]*)\)/g, "\\sqrt{$1}");
  latex = latex.replace(/√([A-Za-zΑ-Ωα-ω0-9]+)/g, "\\sqrt{$1}");
  latex = latex.replaceAll("½", "\\frac{1}{2}").replaceAll("¼", "\\frac{1}{4}").replaceAll("¾", "\\frac{3}{4}");

  return latex;
}

export function renderFormulaHtml(raw: string): { html: string; ok: boolean } {
  if (!raw?.trim()) return { html: "", ok: true };

  try {
    const html = katex.renderToString(toLatex(raw), { throwOnError: false, displayMode: false, strict: false });
    return { html, ok: true };
  } catch {
    return { html: raw, ok: false };
  }
}
