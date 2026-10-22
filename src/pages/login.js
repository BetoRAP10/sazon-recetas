import { h } from '../dom.js';
import { login, lockRemaining } from '../security.js';
import { clean } from '../validation.js';

export function loginPage() {
  const email = h('input', { id: 'login-email', type: 'email', autocomplete: 'email', maxlength: 100, required: true });
  const password = h('input', { id: 'login-password', type: 'password', autocomplete: 'current-password', maxlength: 64, required: true });
  const status = h('div', { class: 'form-status', role: 'status' });
  const submit = h('button', { class: 'btn btn--block', type: 'submit' }, 'Iniciar sesión');

  const form = h('form', { class: 'form', novalidate: true, onSubmit: async (e) => {
    e.preventDefault();
    status.className = 'form-status form-status--error';
    if (!clean(email.value) || !password.value) { status.textContent = 'Escribe tu correo y tu contraseña.'; return; }
    submit.disabled = true;
    try {
      await login(clean(email.value).toLowerCase(), password.value);
      location.hash = '#/';
    } catch (err) {
      status.textContent = err.message;
      password.value = '';
    } finally {
      submit.disabled = lockRemaining() > 0;
      if (submit.disabled) setTimeout(() => { submit.disabled = false; }, lockRemaining() * 1000);
    }
  } },
    h('div', { class: 'field' }, h('label', { for: 'login-email' }, 'Correo electrónico'), email),
    h('div', { class: 'field' }, h('label', { for: 'login-password' }, 'Contraseña'), password),
    submit, status,
    h('p', { class: 'muted center' }, '¿No tienes cuenta? ', h('a', { href: '#/registro' }, 'Regístrate')));

  return h('div', { class: 'page auth auth--single' },
    h('div', { class: 'auth__card' },
      h('h1', {}, 'Iniciar sesión'),
      h('p', { class: 'muted' }, 'Después de 5 intentos fallidos el acceso se bloquea 60 segundos.'),
      form));
}
