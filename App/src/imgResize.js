/**
 * Client-side image optimization: resizes to fit `maxDim` and re-encodes
 * as JPEG, so uploads are small and the menu stays fast on mobile data.
 */
export async function resizeImage(file, maxDim = 900, quality = 0.82) {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error('Could not read that image.');
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', quality));
  if (!blob) throw new Error('Could not process that image.');
  return new File([blob], 'product.jpg', { type: 'image/jpeg' });
}
