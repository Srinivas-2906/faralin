function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function inlineMarkdown(text: string): string {
  return escapeHtml(text).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

export function renderTrackMarkdown(content: string): string {
  const blocks = content.split(/\n\n+/);
  const parts: string[] = [];

  for (const block of blocks) {
    const lines = block.split('\n');
    const isList = lines.every((line) => /^[-*]\s/.test(line.trim()) || line.trim() === '');

    if (isList && lines.some((line) => /^[-*]\s/.test(line.trim()))) {
      const items = lines
        .filter((line) => /^[-*]\s/.test(line.trim()))
        .map((line) => `<li>${inlineMarkdown(line.replace(/^[-*]\s+/, ''))}</li>`)
        .join('');
      parts.push(`<ul class="track-md-list">${items}</ul>`);
      continue;
    }

    const paragraph = lines.map((line) => inlineMarkdown(line)).join('<br />');
    if (paragraph.trim()) {
      parts.push(`<p>${paragraph}</p>`);
    }
  }

  return parts.join('');
}
