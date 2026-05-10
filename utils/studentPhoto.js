export const DEFAULT_STUDENT_PHOTO = '/student-photo-fallback.svg';
export const LEGACY_STUDENT_PHOTO_FALLBACK = 'https://wweb.casitaapps.com/files/1724624551591-file.jpeg';
export const MATRICULA_PHOTO_HOST = 'https://casitaiedis.edu.mx';

const IMAGE_EXT_RE = /\.(?:apng|avif|gif|jpe?g|png|webp)(?:[?#].*)?$/i;

function isLikelyImageReference(value) {
  const raw = String(value || '').trim();
  if (!raw) return false;
  if (/^(?:data:image\/|blob:)/i.test(raw)) return true;
  if (/^https?:\/\//i.test(raw)) return true;
  return IMAGE_EXT_RE.test(raw);
}

export function normalizeStudentPhotoUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return DEFAULT_STUDENT_PHOTO;
  if (/^(?:data:image\/|blob:)/i.test(raw)) return raw;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (!isLikelyImageReference(raw)) return DEFAULT_STUDENT_PHOTO;
  if (raw.startsWith('/virtual/')) return `${MATRICULA_PHOTO_HOST}${raw}`;
  if (raw.startsWith('virtual/')) return `${MATRICULA_PHOTO_HOST}/${raw}`;
  if (raw.startsWith('/')) return `${MATRICULA_PHOTO_HOST}${raw}`;
  return `${MATRICULA_PHOTO_HOST}/virtual/${raw}`;
}

export function hasRealStudentPhoto(value) {
  const raw = String(value || '').trim();
  if (!raw) return false;
  return normalizeStudentPhotoUrl(raw) !== DEFAULT_STUDENT_PHOTO;
}
