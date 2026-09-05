const loginForm = document.getElementById('loginForm');

if (loginForm) {
  const statusMessage = document.getElementById('statusMessage');

  loginForm.addEventListener('submit', (event) => {
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
    loginForm.reset();
  });
}

const uploadForm = document.getElementById('uploadForm');

if (uploadForm) {
  const photoInput = document.getElementById('photos');
  const photoPreview = document.getElementById('photoPreview');
  const photoCount = document.getElementById('photoCount');
  const uploadStatus = document.getElementById('uploadStatus');
  let selectedFiles = [];

  const renderPhotos = () => {
    photoPreview.innerHTML = '';
    selectedFiles.forEach((file, index) => {
      const item = document.createElement('div');
      item.className = 'preview-item';
      item.innerHTML = `<img src="${URL.createObjectURL(file)}" alt="Pré-visualização da foto ${index + 1}"><button class="remove-photo" type="button" aria-label="Remover foto ${index + 1}">×</button>`;
      item.querySelector('button').addEventListener('click', () => {
        selectedFiles.splice(index, 1);
        renderPhotos();
      });
      photoPreview.appendChild(item);
    });

    photoCount.textContent = selectedFiles.length === 0
      ? 'Nenhuma foto selecionada'
      : `${selectedFiles.length} foto${selectedFiles.length > 1 ? 's' : ''} selecionada${selectedFiles.length > 1 ? 's' : ''}`;
  };

  photoInput.addEventListener('change', () => {
    selectedFiles = [...photoInput.files].slice(0, 10);
    renderPhotos();
    uploadStatus.textContent = '';
  });

  uploadForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const plate = document.getElementById('plate').value.trim();

    if (!plate || selectedFiles.length === 0) {
      uploadStatus.textContent = 'Informe a placa e selecione pelo menos uma foto.';
      uploadStatus.style.color = '#d94c4c';
      return;
    }

    uploadStatus.textContent = `Lançamento da placa ${plate.toUpperCase()} salvo com sucesso.`;
    uploadStatus.style.color = '#1ea672';
    uploadForm.reset();
    selectedFiles = [];
    renderPhotos();
  });
}
