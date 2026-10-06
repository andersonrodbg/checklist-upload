const API_URL = 'http://localhost:8080';

// ==============================
// LOGIN
// ==============================

const loginForm = document.getElementById('loginForm');

if (loginForm) {

  const statusMessage = document.getElementById('statusMessage');

  loginForm.addEventListener('submit', (event) => {

    event.preventDefault();

    const user = document.getElementById('user').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!user || !password) {
      statusMessage.textContent =
        'Preencha o usuário e a senha para continuar.';

      statusMessage.style.color = '#d94c4c';
      return;
    }

    statusMessage.textContent =
      `Bem-vindo(a), ${user}! Login realizado com sucesso.`;

    statusMessage.style.color = '#1ea672';

    loginForm.reset();
  });
}


// ==============================
// CHECKLIST / CONFERÊNCIA
// ==============================

const uploadForm = document.getElementById('uploadForm');

if (uploadForm) {

  const actionOptions =
    document.querySelectorAll('[data-action]');

  const consultationPanel =
    document.getElementById('consultationPanel');

  const consultationTitle =
    document.getElementById('consultationTitle');

  const consultationButton =
    document.getElementById('consultationButton');

  const consultationPlate =
    document.getElementById('consultationPlate');

  const consultationStatus =
    document.getElementById('consultationStatus');

  const systemIntro =
    document.querySelector('.system-intro');

  const uploadTitle =
    document.getElementById('uploadTitle');

  const uploadDescription =
    document.getElementById('uploadDescription');

  const photoLabel =
    document.getElementById('photoLabel');

  const photoInput =
    document.getElementById('photos');

  const photoPreview =
    document.getElementById('photoPreview');

  const photoCount =
    document.getElementById('photoCount');

  const uploadStatus =
    document.getElementById('uploadStatus');

  let selectedFiles = [];

  let currentAction = 'send-checklist';


  // ==============================
  // TEXTOS
  // ==============================

  const actionLabels = {

    checklist: {
      title: 'Fotos e placa',
      description:
        'Informe a placa da carreta e anexe as fotos do checklist.',
      photoLabel:
        'Fotos do checklist'
    },

    conferencia: {
      title: 'Fotos e placa',
      description:
        'Informe a placa da carreta e anexe as fotos da conferencia.',
      photoLabel:
        'Fotos da conferencia'
    }
  };


  // ==============================
  // TROCA DE AÇÃO
  // ==============================

  const showAction = (action) => {

    currentAction = action;

    actionOptions.forEach((option) => {

      option.classList.toggle(
        'active',
        option.dataset.action === action
      );

    });

    const isConsultation =
      action.startsWith('consult-');

    consultationPanel.hidden =
      !isConsultation;

    systemIntro.hidden =
      isConsultation;

    uploadForm.hidden =
      isConsultation;


    if (isConsultation) {

      const type =
        action.endsWith('checklist')
          ? 'checklist'
          : 'conferencia';

      consultationTitle.textContent =
        `Consultar ${type}`;

      consultationStatus.textContent = '';

      return;
    }


    const type =
      action.endsWith('checklist')
        ? 'checklist'
        : 'conferencia';

    uploadTitle.textContent =
      actionLabels[type].title;

    uploadDescription.textContent =
      actionLabels[type].description;

    photoLabel.textContent =
      actionLabels[type].photoLabel;

    uploadStatus.textContent = '';
  };


  actionOptions.forEach((option) => {

    option.addEventListener('click', () => {

      showAction(option.dataset.action);

    });

  });


  // ==============================
  // CONSULTAR
  // ==============================

 consultationButton.addEventListener('click', async () => {
    const plate = consultationPlate.value.trim();

    if (!plate) {
        consultationStatus.textContent = 'Informe a placa para realizar a consulta.';
        consultationStatus.style.color = '#d94c4c';
        return;
    }

    consultationStatus.textContent = 'Consultando...';
    consultationStatus.style.color = '#5d6b7b';

    try {
        const isChecklist = currentAction === 'consult-checklist';

        const endpoint = isChecklist
            ? `${API_URL}/checklists/placa/${encodeURIComponent(plate)}`
            : `${API_URL}/conferencias/placa/${encodeURIComponent(plate)}`;

        const response = await fetch(endpoint);

        if (!response.ok) {
            throw new Error('Erro ao consultar registro.');
        }

        const registros = await response.json();

        if (registros.length === 0) {
            consultationStatus.textContent =
                `Nenhum ${isChecklist ? 'checklist' : 'registro de conferência'} encontrado para a placa ${plate.toUpperCase()}.`;

            consultationStatus.style.color = '#d94c4c';

            mostrarResultadoConsulta(null);
            return;
        }

        // O backend já envia o mais recente primeiro
        const ultimo = registros[0];

        mostrarResultadoConsulta(ultimo);

        consultationStatus.textContent =
            'Último registro encontrado.';
        consultationStatus.style.color = '#1ea672';

    } catch (error) {
        console.error(error);

        consultationStatus.textContent =
            'Não foi possível realizar a consulta.';
        consultationStatus.style.color = '#d94c4c';
    }
});

function mostrarResultadoConsulta(registro) {

    let resultado = document.getElementById('consultaResultado');

    if (!resultado) {
        resultado = document.createElement('div');
        resultado.id = 'consultaResultado';
        resultado.className = 'consulta-resultado';

        consultationPanel.appendChild(resultado);
    }

    if (!registro) {
        resultado.innerHTML = '';
        return;
    }

    const dataHora = new Date(registro.dataHora);

    const data = dataHora.toLocaleDateString('pt-BR');

    const hora = dataHora.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });

    resultado.innerHTML = `
        <div class="resultado-header">
            <span>ÚLTIMO CHECKLIST</span>
        </div>

        <div class="resultado-grid">

            <div class="resultado-item">
                <small>PLACA</small>
                <strong>${registro.placa}</strong>
            </div>

            <div class="resultado-item">
                <small>DATA</small>
                <strong>${data}</strong>
            </div>

            <div class="resultado-item">
                <small>HORA</small>
                <strong>${hora}</strong>
            </div>

        </div>

        <div class="resultado-observacao">
            <small>OBSERVAÇÕES</small>
            <p>${registro.observacoes || 'Nenhuma observação registrada.'}</p>
        </div>
    `;
}

  // ==============================
  // FOTOS
  // ==============================

  const renderPhotos = () => {

    photoPreview.innerHTML = '';


    selectedFiles.forEach((file, index) => {

      const item =
        document.createElement('div');

      item.className =
        'preview-item';


      const image =
        document.createElement('img');

      image.src =
        URL.createObjectURL(file);

      image.alt =
        `Pré-visualização da foto ${index + 1}`;


      const button =
        document.createElement('button');

      button.type = 'button';

      button.className =
        'remove-photo';

      button.textContent = '×';

      button.setAttribute(
        'aria-label',
        `Remover foto ${index + 1}`
      );


      button.addEventListener(
        'click',
        () => {

          selectedFiles.splice(index, 1);

          renderPhotos();

        }
      );


      item.appendChild(image);

      item.appendChild(button);

      photoPreview.appendChild(item);

    });


    photoCount.textContent =
      selectedFiles.length === 0
        ? 'Nenhuma foto selecionada'
        : `${selectedFiles.length} foto${
            selectedFiles.length > 1 ? 's' : ''
          } selecionada${
            selectedFiles.length > 1 ? 's' : ''
          }`;
  };


  photoInput.addEventListener(
    'change',
    () => {

      selectedFiles =
        [...photoInput.files].slice(0, 10);

      renderPhotos();

      uploadStatus.textContent = '';
    }
  );


  // ==============================
  // ENVIAR CHECKLIST / CONFERÊNCIA
  // ==============================

  uploadForm.addEventListener(
    'submit',
    async (event) => {

      event.preventDefault();


      const plate =
        document.getElementById('plate')
          .value
          .trim()
          .toUpperCase();


      const notes =
        document.getElementById('notes')
          .value
          .trim();


      if (!plate) {

        uploadStatus.textContent =
          'Informe a placa da carreta.';

        uploadStatus.style.color =
          '#d94c4c';

        return;
      }


      if (selectedFiles.length === 0) {

        uploadStatus.textContent =
          'Selecione pelo menos uma foto.';

        uploadStatus.style.color =
          '#d94c4c';

        return;
      }


      const isChecklist =
        currentAction === 'send-checklist';


      const endpoint = isChecklist
        ? `${API_URL}/checklists`
        : `${API_URL}/conferencias`;


      const body = {

        placa: plate,

        observacoes: notes

      };


      uploadStatus.textContent =
        'Salvando...';

      uploadStatus.style.color =
        '#5d6b7b';


      try {

        const response =
          await fetch(endpoint, {

            method: 'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body: JSON.stringify(body)

          });


        if (!response.ok) {

          throw new Error(
            'Erro ao salvar registro.'
          );

        }


        const data =
          await response.json();


        console.log(
          'Registro salvo:',
          data
        );


        const type =
          isChecklist
            ? 'Checklist'
            : 'Conferência';


        uploadStatus.textContent =
          `${type} da placa ${plate} enviado com sucesso!`;

        uploadStatus.style.color =
          '#1ea672';


        uploadForm.reset();

        selectedFiles = [];

        renderPhotos();


      } catch (error) {

        console.error(error);

        uploadStatus.textContent =
          'Não foi possível salvar o registro.';

        uploadStatus.style.color =
          '#d94c4c';
      }

    }
  );

}