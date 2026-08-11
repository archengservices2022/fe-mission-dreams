import { renderFormulaHtml } from "@/lib/formula";

type Props = {
  text: string;
  className?: string;
};

export default function Formula({ text, className }: Props) {
  const { html, ok } = renderFormulaHtml(text);

  if (!ok) return <span className={className}>{text}</span>;

  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
