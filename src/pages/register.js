import { h } from '../dom.js';
import { rules, passwordChecks, clean } from '../validation.js';
import { registerUser, emailTaken } from '../security.js';

function field(label, input, help) {
  const error = h('p', { class: 'field__error', id: `${input.id}-error`, 'aria-live': 'polite' });
  input.setAttribute('aria-describedby', `${input.id}-error`);
  return { el: h('div', { class: 'field' }, h('label', { for: input.id }, label), input, help, error), error };
}

export function register() {
  const today = new Date().toISOString().slice(0, 10);
  const inputs = {
    name: h('input', { id: 'name', name: 'name', autocomplete: 'name', maxlength: 50, placeholder: 'Ana López' }),
    email: h('input', { id: 'email', name: 'email', type: 'email', autocomplete: 'email', maxlength: 100, placeholder: 'ana@correo.com' }),
    phone: h('input', { id: 'phone', name: 'phone', type: 'tel', inputmode: 'numeric', autocomplete: 'tel', maxlength: 12, placeholder: '6641234567' }),
    birthdate: h('input', { id: 'birthdate', name: 'birthdate', type: 'date', max: today }),
    password: h('input', { id: 'password', name: 'password', type: 'password', autocomplete: 'new-password', maxlength: 64 }),
    confirm: h('input', { id: 'confirm', name: 'confirm', type: 'password', autocomplete: 'new-password', maxlength: 64 }),
    terms: h('input', { id: 'terms', name: 'terms', type: 'checkbox' }),
  };

  const meterBar = h('span', { class: 'meter__bar' });
  const meterLabel = h('span', { class: 'meter__label' }, 'Seguridad: —');
  const checklist = h('ul', { class: 'checks' });
  const pwHelp = h('div', {}, h('div', { class: 'meter', 'aria-hidden': 'true' }, meterBar), meterLabel, checklist);

  const fields = {
    name: field('Nombre completo', inputs.name),
    email: field('Correo electrónico', inputs.email),
    phone: field('Teléfono (10 dígitos)', inputs.phone),
    birthdate: field('Fecha de nacimiento', inputs.birthdate),
    password: field('Contraseña', inputs.password, pwHelp),
    confirm: field('Confirmar contraseña', inputs.confirm),
  };
  const termsError = h('p', { class: 'field__error', id: 'terms-error', 'aria-live': 'polite' });
  inputs.terms.setAttribute('aria-describedby', 'terms-error');
  const status = h('div', { class: 'form-status', role: 'status' });
  const submit = h('button', { class: 'btn btn--block', type: 'submit' }, 'Crear cuenta');

  const form = h('form', { class: 'form', novalidate: true, autocomplete: 'on' },
    fields.name.el,
    h('div', { class: 'row' }, fields.email.el, fields.phone.el),
    fields.birthdate.el,
    h('div', { class: 'row' }, fields.password.el, fields.confirm.el),
    h('div', { class: 'field field--check' },
      h('label', { for: 'terms' }, inputs.terms, ' Acepto los términos de uso y el aviso de privacidad'), termsError),
    submit, status,
    h('p', { class: 'muted center' }, '¿Ya tienes cuenta? ', h('a', { href: '#/login' }, 'Inicia sesión')));

  const errors = { ...Object.fromEntries(Object.entries(fields).map(([k, f]) => [k, f.error])), terms: termsError };
  const touched = new Set();

  function validate(key) {
    const message = rules[key](key === 'terms' ? '' : inputs[key].value, { form, emailTaken });
    errors[key].textContent = message;
    inputs[key].setAttribute('aria-invalid', message ? 'true' : 'false');
    inputs[key].closest('.field').classList.toggle('field--invalid', Boolean(message));
    inputs[key].closest('.field').classList.toggle('field--valid', !message && key !== 'terms');
    return !message;
  }

  function updateMeter() {
    const checks = passwordChecks(inputs.password.value);
    const score = checks.filter((c) => c.ok).length;
    const levels = ['—', 'Muy débil', 'Muy débil', 'Débil', 'Regular', 'Buena', 'Fuerte'];
    meterBar.style.width = `${(score / checks.length) * 100}%`;
    meterBar.dataset.level = String(score);
    meterLabel.textContent = `Seguridad: ${inputs.password.value ? levels[score] : '—'}`;
    checklist.replaceChildren(...checks.map((c) => h('li', { class: c.ok ? 'ok' : '' }, `${c.ok ? '✓' : '○'} ${c.label}`)));
  }
  updateMeter();

  for (const key of Object.keys(inputs)) {
    const input = inputs[key];
    input.addEventListener(key === 'terms' ? 'change' : 'blur', () => { touched.add(key); validate(key); });
    input.addEventListener('input', () => {
      if (status.textContent) { status.className = 'form-status'; status.textContent = ''; }
      if (key === 'password') { updateMeter(); if (touched.has('confirm')) validate('confirm'); }
      if (key === 'phone') input.value = input.value.replace(/[^\d]/g, '').slice(0, 10);
      if (touched.has(key)) validate(key);
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.className = 'form-status';
    status.textContent = '';
    const results = Object.keys(inputs).map((k) => { touched.add(k); return validate(k); });
    if (results.includes(false)) {
      status.className = 'form-status form-status--error';
      status.textContent = 'Revisa los campos marcados en rojo.';
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    submit.disabled = true;
    submit.textContent = 'Cifrando contraseña…';
    try {
      await registerUser({
        name: clean(inputs.name.value),
        email: clean(inputs.email.value).toLowerCase(),
        phone: inputs.phone.value,
        birthdate: inputs.birthdate.value,
        password: inputs.password.value,
      });
      form.replaceChildren(h('div', { class: 'success' },
        h('span', { class: 'success__icon', 'aria-hidden': 'true' }, '✓'),
        h('h2', {}, `¡Bienvenido, ${clean(inputs.name.value).split(' ')[0]}!`),
        h('p', {}, 'Tu cuenta se creó correctamente y ya iniciaste sesión.'),
        h('a', { class: 'btn', href: '#/recetas' }, 'Explorar recetas')));
    } catch (err) {
      status.className = 'form-status form-status--error';
      status.textContent = err.message;
      submit.disabled = false;
      submit.textContent = 'Crear cuenta';
    }
  });

  return h('div', { class: 'page auth' },
    h('div', { class: 'auth__card' },
      h('h1', {}, 'Crear cuenta'),
      h('p', { class: 'muted' }, 'Guarda tus recetas favoritas y recibe ideas nuevas cada semana.'),
      form),
    h('aside', { class: 'auth__aside' },
      h('h2', {}, 'Tu información está protegida'),
      h('ul', { class: 'secure-list' },
        h('li', {}, h('strong', {}, 'Validación de campos: '), 'cada dato se revisa antes de enviarse.'),
        h('li', {}, h('strong', {}, 'Contraseña cifrada: '), 'se guarda como hash PBKDF2-SHA-256 con sal, nunca en texto plano.'),
        h('li', {}, h('strong', {}, 'Contraseña robusta: '), 'mínimo 8 caracteres con mayúsculas, minúsculas, números y símbolos.'),
        h('li', {}, h('strong', {}, 'Sin inyección de código: '), 'los textos se insertan como texto, nunca como HTML.'))));
}
