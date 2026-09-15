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
  const actionOptions = document.querySelectorAll('[data-action]');
  const consultationPanel = document.getElementById('consultationPanel');
  const consultationTitle = document.getElementById('consultationTitle');
  const consultationButton = document.getElementById('consultationButton');
  const consultationPlate = document.getElementById('consultationPlate');
  const consultationStatus = document.getElementById('consultationStatus');
  const systemIntro = document.querySelector('.system-intro');
  const uploadTitle = document.getElementById('uploadTitle');
  const uploadDescription = document.getElementById('uploadDescription');
  const photoLabel = document.getElementById('photoLabel');
  const photoInput = document.getElementById('photos');
  const photoPreview = document.getElementById('photoPreview');
  const photoCount = document.getElementById('photoCount');
  const uploadStatus = document.getElementById('uploadStatus');
  let selectedFiles = [];
  let currentAction = 'send-checklist';

  const actionLabels = {
    checklist: {
      title: 'Fotos e placa',
      description: 'Informe a placa da carreta e anexe as fotos do checklist.',
      photoLabel: 'Fotos do checklist'
    },
    conferencia: {
      title: 'Fotos e placa',
      description: 'Informe a placa da carreta e anexe as fotos da conferencia.',
      photoLabel: 'Fotos da conferencia'
    }
  };

  const showAction = (action) => {
    currentAction = action;
    actionOptions.forEach((option) => option.classList.toggle('active', option.dataset.action === action));

    const isConsultation = action.startsWith('consult-');
    consultationPanel.hidden = !isConsultation;
    systemIntro.hidden = isConsultation;
    uploadForm.hidden = isConsultation;

    if (isConsultation) {
      const type = action.endsWith('checklist') ? 'checklist' : 'conferencia';
      consultationTitle.textContent = `Consultar ${type}`;
      consultationStatus.textContent = '';
      return;
    }

    const type = action.endsWith('checklist') ? 'checklist' : 'conferencia';
    uploadTitle.textContent = actionLabels[type].title;
    uploadDescription.textContent = actionLabels[type].description;
    photoLabel.textContent = actionLabels[type].photoLabel;
    uploadStatus.textContent = '';
  };

  actionOptions.forEach((option) => {
    option.addEventListener('click', () => showAction(option.dataset.action));
  });

  consultationButton.addEventListener('click', () => {
    const plate = consultationPlate.value.trim();
    if (!plate) {
      consultationStatus.textContent = 'Informe a placa para realizar a consulta.';
      consultationStatus.style.color = '#d94c4c';
      return;
    }

    consultationStatus.textContent = `Consulta da placa ${plate.toUpperCase()} realizada. Nenhum registro encontrado.`;
    consultationStatus.style.color = '#5d6b7b';
  });

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

    const type = currentAction.endsWith('checklist') ? 'checklist' : 'conferencia';
    uploadStatus.textContent = `${type[0].toUpperCase() + type.slice(1)} da placa ${plate.toUpperCase()} enviado com sucesso.`;
    uploadStatus.style.color = '#1ea672';
    uploadForm.reset();
    selectedFiles = [];
    renderPhotos();
  });
}
