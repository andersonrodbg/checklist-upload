const form = document.getElementById('loginForm');
const statusMessage = document.getElementById('statusMessage');

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const user = document.getElementById('user').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!user || !password) {
    statusMessage.textContent = 'Preencha o usuário e a senha para continuar.';
    statusMessage.style.color = '#d94c4c';
    return;
  }

  statusMessage.textContent = `Bem-vindo(a), ${user}! Login realizado com sucesso.`;
  statusMessage.style.color = '#1ea672';
  form.reset();
});
