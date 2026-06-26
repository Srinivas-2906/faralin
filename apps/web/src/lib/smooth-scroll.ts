export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function smoothScrollTo(
  element: HTMLElement,
  targetLeft: number,
  duration = 480,
): () => void {
  const start = element.scrollLeft;
  const distance = targetLeft - start;

  if (Math.abs(distance) < 1) {
    return () => {};
  }

  const startTime = performance.now();
  let rafId = 0;

  const step = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    element.scrollLeft = start + distance * easeInOutCubic(progress);

    if (progress < 1) {
      rafId = requestAnimationFrame(step);
    }
  };

  rafId = requestAnimationFrame(step);

  return () => cancelAnimationFrame(rafId);
}
