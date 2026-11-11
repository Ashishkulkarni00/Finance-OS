/**
 * Where a floating layer (a dropdown, a tip) should be portalled from `trigger`.
 *
 * <p>A modal `<dialog>` lives in the browser's top layer, which paints above everything else
 * on the page regardless of z-index. A dropdown portalled to `document.body` from inside a
 * sheet would therefore open *behind* it and be invisible. Portal into the nearest open
 * dialog instead (the dialog element itself, not its panel: the panel carries a transform while
 * animating, and a transformed ancestor re-bases `position: fixed`).
 */
export function portalTarget(trigger: Element | null | undefined): HTMLElement {
  return (trigger?.closest('dialog') as HTMLElement | null) ?? document.body;
}

/**
 * The layer a floating thing with no trigger element (a right-click menu) should render in: the
 * topmost open modal dialog if there is one, else the body. Same reason as {@link portalTarget} -
 * the top layer paints above everything outside it.
 */
export function topLayerTarget(): HTMLElement {
  const open = document.querySelectorAll<HTMLElement>('dialog[open]');
  return open.length ? open[open.length - 1]! : document.body;
}
