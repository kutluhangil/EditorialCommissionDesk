export function openStudioCommandPalette() {
  window.dispatchEvent(new CustomEvent("ecd:open-command-palette"));
}
