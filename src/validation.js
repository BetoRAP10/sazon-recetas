// Reglas de validación del registro. Cada regla devuelve un mensaje de error o ''.
export const clean = (value) => value.normalize('NFC').replace(/\s+/g, ' ').trim();

const NAME_RE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' ]+$/;
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const PHONE_RE = /^\d{10}$/;

export function ageFrom(dateStr, today = new Date()) {
  const birth = new Date(`${dateStr}T00:00:00`);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function passwordChecks(pw) {
  return [
    { ok: pw.length >= 8, label: 'Mínimo 8 caracteres' },
    { ok: /[A-Z]/.test(pw), label: 'Una letra mayúscula' },
    { ok: /[a-z]/.test(pw), label: 'Una letra minúscula' },
    { ok: /\d/.test(pw), label: 'Un número' },
    { ok: /[^A-Za-z0-9\s]/.test(pw), label: 'Un símbolo (!@#$…)' },
    { ok: pw.length > 0 && !/\s/.test(pw), label: 'Sin espacios' },
  ];
}

export const rules = {
  name(v) {
    const value = clean(v);
    if (!value) return 'Escribe tu nombre.';
    if (value.length < 3 || value.length > 50) return 'El nombre debe tener entre 3 y 50 caracteres.';
    if (!NAME_RE.test(value)) return 'Usa solo letras y espacios.';
    return '';
  },
  email(v, { emailTaken }) {
    const value = clean(v).toLowerCase();
    if (!value) return 'Escribe tu correo electrónico.';
    if (value.length > 100 || !EMAIL_RE.test(value)) return 'Escribe un correo válido, por ejemplo nombre@correo.com.';
    if (emailTaken(value)) return 'Ya existe una cuenta con ese correo.';
    return '';
  },
  phone(v) {
    const value = v.replace(/[\s-]/g, '');
    if (!value) return 'Escribe tu teléfono.';
    if (!PHONE_RE.test(value)) return 'El teléfono debe tener 10 dígitos.';
    return '';
  },
  birthdate(v) {
    if (!v) return 'Selecciona tu fecha de nacimiento.';
    if (Number.isNaN(Date.parse(v)) || new Date(`${v}T00:00:00`) > new Date()) return 'La fecha no es válida.';
    const age = ageFrom(v);
    if (age < 13) return 'Debes tener al menos 13 años.';
    if (age > 120) return 'Revisa el año de nacimiento.';
    return '';
  },
  password(v, { form }) {
    if (!v) return 'Crea una contraseña.';
    if (passwordChecks(v).some((c) => !c.ok)) return 'La contraseña no cumple todos los requisitos.';
    const user = clean(form.email.value).toLowerCase().split('@')[0];
    if (user.length >= 3 && v.toLowerCase().includes(user)) return 'La contraseña no debe contener tu correo.';
    return '';
  },
  confirm(v, { form }) {
    if (!v) return 'Confirma tu contraseña.';
    if (v !== form.password.value) return 'Las contraseñas no coinciden.';
    return '';
  },
  terms(_, { form }) {
    return form.terms.checked ? '' : 'Debes aceptar los términos y el aviso de privacidad.';
  },
};
