/**
 * Social Sharing Utilities for Web Share API and Canvas Blob downloads
 */
export function canNativeShare(blob: Blob): boolean {
  if (!navigator.share) return false;
  
  try {
    const file = new File([blob], 'legacy-insights.png', { type: 'image/png' });
    return navigator.canShare && navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

/**
 * Invokes native share dialog on mobile (WhatsApp, IG Stories, TikTok)
 */
export async function shareToSocial(blob: Blob, text: string = 'Check out my weekly wrapped stats on Legacy Life Builder! ⚡'): Promise<boolean> {
  if (!navigator.share) return false;

  try {
    const file = new File([blob], 'legacy-insights.png', { type: 'image/png' });
    await navigator.share({
      title: 'Legacy Life Builder Insights',
      text: text,
      files: [file]
    });
    return true;
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.error('Sharing failed:', err);
    }
    return false;
  }
}

/**
 * Downloads a Blob directly to the user's filesystem
 */
export function downloadShareImage(blob: Blob, filename: string = 'legacy-wrapped.png') {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Copies the image directly to the user's clipboard (supported in modern browsers)
 */
export async function copyToClipboard(blob: Blob): Promise<boolean> {
  if (!navigator.clipboard || !window.ClipboardItem) return false;
  
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob
      })
    ]);
    return true;
  } catch (err) {
    console.warn('Clipboard copy failed:', err);
    return false;
  }
}
