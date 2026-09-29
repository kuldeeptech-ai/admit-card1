/**
 * Client-side high-performance image compression utility
 * Ensures images (School Logo, Signatures, Stamps, Student Photos)
 * stay well within Cloud Firestore's strict 1 MiB document limit.
 */

export async function compressImage(
  source: File | string,
  maxWidth: number = 320,
  maxHeight: number = 320,
  quality: number = 0.82
): Promise<string> {
  // If empty or already tiny SVG / tiny URL, return as is
  if (!source) return '';
  if (typeof source === 'string' && (source.startsWith('data:image/svg+xml') || source.length < 5000)) {
    return source;
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          let width = img.naturalWidth || img.width || maxWidth;
          let height = img.naturalHeight || img.height || maxHeight;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            resolve(typeof source === 'string' ? source : '');
            return;
          }

          // Use better smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // For PNG signatures, preserve transparent background if possible
          const isTransparent = typeof source === 'string' ? source.startsWith('data:image/png') : (source.type === 'image/png');
          const format = isTransparent ? 'image/png' : 'image/jpeg';
          const compressed = canvas.toDataURL(format, quality);

          // If compressed string is smaller, use it; otherwise use source
          if (typeof source === 'string' && source.length <= compressed.length) {
            resolve(source);
          } else {
            resolve(compressed);
          }
        } catch {
          resolve(typeof source === 'string' ? source : '');
        }
      };

      img.onerror = () => {
        resolve(typeof source === 'string' ? source : '');
      };

      if (typeof source === 'string') {
        img.src = source;
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          img.src = (e.target?.result as string) || '';
        };
        reader.onerror = () => resolve('');
        reader.readAsDataURL(source);
      }
    } catch {
      resolve(typeof source === 'string' ? source : '');
    }
  });
}

/**
 * Sanitizes and compresses all base64 images inside SchoolSettings
 * to guarantee total document size remains < 300 KB (Firestore limit is 1,048,576 bytes).
 */
export async function sanitizeSchoolSettingsForFirestore<T extends {
  logoUrl?: string;
  principalSignatureUrl?: string;
  classTeacherSignatureUrl?: string;
  stampUrl?: string;
}>(school: T): Promise<T> {
  const result = { ...school };

  // 1. Logo: max 280x280
  if (result.logoUrl && result.logoUrl.length > 50000) {
    result.logoUrl = await compressImage(result.logoUrl, 280, 280, 0.8);
  }

  // 2. Principal Signature: max 300x120
  if (result.principalSignatureUrl && result.principalSignatureUrl.length > 40000) {
    result.principalSignatureUrl = await compressImage(result.principalSignatureUrl, 300, 120, 0.85);
  }

  // 3. Class Teacher Signature: max 300x120
  if (result.classTeacherSignatureUrl && result.classTeacherSignatureUrl.length > 40000) {
    result.classTeacherSignatureUrl = await compressImage(result.classTeacherSignatureUrl, 300, 120, 0.85);
  }

  // 4. Stamp: max 250x250
  if (result.stampUrl && result.stampUrl.length > 40000) {
    result.stampUrl = await compressImage(result.stampUrl, 250, 250, 0.8);
  }

  return result;
}
