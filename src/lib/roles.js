export const ROLE_LABELS = {
  master: 'Master IT & Super Admin',
  it_admin: 'Master IT & Super Admin',
  admin: 'Admin Klinik',
  psikolog: 'Psikolog',
  terapis: 'Terapis',
  guest: 'Tanpa Akses',
};

const SHIMA_EMAILS = ['salsabilshima@gmail.com'];
const CASMI_EMAILS = ['casmi.gustari@benangmerah.id', 'casmigustari@gmail.com', 'casmi.gustari@gmail.com'];
const RIDHO_EMAILS = ['ridhoalfattaah17@gmail.com'];
const FAUZAN_EMAILS = ['fauzanhamdani@gmail.com', 'fauzan@benangmerah.id'];

export function normalizeRole(rawRole, { email = '', fullName = '' } = {}) {
  const role = String(rawRole || '').toLowerCase().trim();
  const emailL = email.toLowerCase().trim();
  const nameL = fullName.toLowerCase().trim();

  // 1. ROLE MASTER (Khusus IT / Ridho - Super Admin & Kontrol Sistem Penuh)
  if (
    role === 'master' ||
    role === 'it' ||
    role === 'it_admin' ||
    RIDHO_EMAILS.includes(emailL) ||
    nameL.includes('ridho al fattaah') ||
    nameL.includes('ridho')
  ) {
    return 'master';
  }

  // 2. ROLE TERAPIS (Shima, Silvi, Difa, Eka, Casmi Gustari)
  const isShimaAccount =
    SHIMA_EMAILS.includes(emailL) ||
    nameL.includes('shima adinda') ||
    (nameL.includes('shima') && nameL.includes('salsabil'));

  const isCasmiAccount =
    CASMI_EMAILS.includes(emailL) ||
    nameL.includes('casmi gustari') ||
    nameL.includes('casmi');

  if (isShimaAccount || isCasmiAccount || role === 'terapis' || role === 'therapist') {
    return 'terapis';
  }

  // 3. ROLE ADMIN (Murni Fauzan dan staf admin baru)
  if (FAUZAN_EMAILS.includes(emailL) || nameL.includes('fauzan') || role === 'admin') {
    return 'admin';
  }

  // 4. ROLE PSIKOLOG
  if (role === 'psikolog' || role === 'psychologist') {
    return 'psikolog';
  }

  return 'guest';
}

export function accessFromRole(role) {
  const isMaster = role === 'master' || role === 'it_admin';
  return {
    hasMasterAccess: isMaster,
    hasAdminAccess: isMaster || role === 'admin',
    hasTherapistAccess: role === 'terapis',
    hasPsychologistAccess: role === 'psikolog',
    isDualAdminTherapist: false,
  };
}

export function matchesTherapistAssignment(assignedTo, userName) {
  if (!assignedTo || !userName) return false;

  const assignedLower = assignedTo.toLowerCase();
  const currentNameLower = userName.toLowerCase();
  if (assignedLower.includes(currentNameLower) || currentNameLower.includes(assignedLower)) {
    return true;
  }

  const aliases = [
    { user: ['difa', 'nadifa', 'nadifah'], assigned: ['nadifa', 'difa', 'nadifah'] },
    { user: ['shima', 'salsabil'], assigned: ['shima', 'sima', 'salsabil'] },
    { user: ['casmi', 'gustari'], assigned: ['casmi', 'gustari'] },
  ];

  return aliases.some(
    (entry) =>
      entry.user.some((key) => currentNameLower.includes(key)) &&
      entry.assigned.some((key) => assignedLower.includes(key))
  );
}
