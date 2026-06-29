import React from "react";

/** Minimal, bağımlılıksız markdown render: ## h2, ### h3, "- " liste, **kalın**, paragraf. */
export function Markdown({ content }: { content: string }) {
  const blocks = content.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return (
    <div className="space-y-5">
      {blocks.map((b, i) => (
        <Block key={i} text={b.trim()} />
      ))}
    </div>
  );
}

function inline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold text-foreground">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  );
}

function Block({ text }: { text: string }) {
  if (!text) return null;
  if (text.startsWith("### "))
    return <h3 className="pt-1 font-serif text-xl font-semibold tracking-tight">{text.slice(4)}</h3>;
  if (text.startsWith("## "))
    return (
      <h2 className="pt-2 font-serif text-2xl font-semibold tracking-tight md:text-3xl">
        {text.slice(3)}
      </h2>
    );
  if (/^([-*])\s/.test(text)) {
    const items = text
      .split("\n")
      .map((l) => l.replace(/^([-*])\s/, "").trim())
      .filter(Boolean);
    return (
      <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
        {items.map((it, i) => (
          <li key={i}>{inline(it)}</li>
        ))}
      </ul>
    );
  }
  return <p className="leading-relaxed text-foreground/85">{inline(text)}</p>;
}
