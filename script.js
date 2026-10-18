
const API_URL = 'http://localhost:8080';
const $ = (id) => document.getElementById(id);

// LOGIN (apenas visual, sem autenticação no backend)
if ($('loginForm')) {
  $('loginForm').addEventListener('submit', (event) => {
    event.preventDefault();

    const user = $('user').value.trim();
    const password = $('password').value.trim();
    const status = $('statusMessage');

    status.textContent = user && password
      ? `Bem-vindo(a), ${user}! Login realizado na interface.`
      : 'Preencha o usuário e a senha para continuar.';

    status.style.color = user && password ? '#1ea672' : '#d94c4c';

    if (user && password) $('loginForm').reset();
  });
}

// CHECKLIST E CONFERÊNCIA
if ($('uploadForm')) {
  const options = document.querySelectorAll('[data-action]');
  const form = $('uploadForm');
  const photoInput = $('photos');
  const preview = $('photoPreview');

  const result = document.createElement('div');
  result.id = 'consultaResultado';
  result.className = 'consulta-resultado';
  $('consultationPanel').appendChild(result);

  let action = 'send-checklist';
  let files = [];
  let previewUrls = [];

  const isChecklist = () => action.endsWith('checklist');
  const basePath = () => isChecklist() ? 'checklists' : 'conferencias';

  function status(id, message, success = false) {
    $(id).textContent = message;
    $(id).style.color = success ? '#1ea672' : '#d94c4c';
  }

  // Alternar opções do menu
  function changeAction(next) {
    action = next;

    const consulting = action.startsWith('consult-');
    const type = isChecklist() ? 'checklist' : 'conferência';

    options.forEach((option) => {
      option.classList.toggle(
        'active',
        option.dataset.action === action
      );
    });

    $('consultationPanel').hidden = !consulting;
    document.querySelector('.system-intro').hidden = consulting;
    form.hidden = consulting;

    $('consultationTitle').textContent = `Consultar ${type}`;
    $('uploadTitle').textContent = 'Fotos e placa';
    $('uploadDescription').textContent =
      `Informe a placa e anexe as fotos da ${type}.`;
    $('photoLabel').textContent = `Fotos da ${type}`;

    $('consultationStatus').textContent = '';
    $('uploadStatus').textContent = '';
    result.replaceChildren();
  }

  options.forEach((option) => {
    option.addEventListener('click', () => {
      changeAction(option.dataset.action);
    });
  });

  // Formatar data e hora
  function formatDate(value) {
    if (!value) return ['Não informada', 'Não informada'];

    const match = String(value).match(
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/
    );

    // LocalDateTime já salvo no horário de Brasília
    if (match && !/(Z|[+-]\d{2}:\d{2})$/i.test(value)) {
      return [
        `${match[3]}/${match[2]}/${match[1]}`,
        `${match[4]}:${match[5]}`
      ];
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return ['Não informada', 'Não informada'];
    }

    const opts = { timeZone: 'America/Sao_Paulo' };

    return [
      date.toLocaleDateString('pt-BR', opts),
      date.toLocaleTimeString('pt-BR', {
        ...opts,
        hour: '2-digit',
        minute: '2-digit'
      })
    ];
  }

  // Exibir último registro
  function showResult(record) {
    result.replaceChildren();

    if (!record) return;

    const [date, time] = formatDate(record.dataHora);

    const heading = document.createElement('div');
    heading.className = 'resultado-header';
    heading.textContent = isChecklist()
      ? 'ÚLTIMO CHECKLIST'
      : 'ÚLTIMA CONFERÊNCIA';

    result.appendChild(heading);

    const grid = document.createElement('div');
    grid.className = 'resultado-grid';

    [
      ['PLACA', record.placa],
      ['DATA', date],
      ['HORA', time]
    ].forEach(([label, value]) => {
      const item = document.createElement('div');
      item.className = 'resultado-item';

      const small = document.createElement('small');
      small.textContent = label;

      const strong = document.createElement('strong');
      strong.textContent = value || 'Não informada';

      item.append(small, strong);
      grid.appendChild(item);
    });

    result.appendChild(grid);

    const notes = document.createElement('div');
    notes.className = 'resultado-observacao';

    const label = document.createElement('small');
    label.textContent = 'OBSERVAÇÕES';

    const paragraph = document.createElement('p');
    paragraph.textContent =
      record.observacoes || 'Nenhuma observação registrada.';

    notes.append(label, paragraph);
    result.appendChild(notes);

    // Fotos salvas no Cloudinary
    if (Array.isArray(record.fotos) && record.fotos.length) {
      const gallery = document.createElement('div');
      gallery.className = 'galeria-checklist';

      const title = document.createElement('h3');
      title.textContent = 'Fotos do checklist';
      gallery.appendChild(title);

      record.fotos.forEach((foto, index) => {
        if (!foto.url ||
            !foto.url.startsWith('https://res.cloudinary.com/')) {
          return;
        }

        const link = document.createElement('a');
        link.href = foto.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';

        const img = document.createElement('img');
        img.src = foto.url;
        img.alt = `Foto ${index + 1} do checklist`;
        img.loading = 'lazy';

        link.appendChild(img);
        gallery.appendChild(link);
      });

      result.appendChild(gallery);
    }
  }

  // Consultar placa no backend
  $('consultationButton').addEventListener('click', async () => {
    const plate = $('consultationPlate')
      .value.trim().toUpperCase().replace('-', '');

    if (!plate) {
      return status('consultationStatus', 'Informe a placa.');
    }

    result.replaceChildren();
    $('consultationStatus').textContent = 'Consultando...';

    try {
      const response = await fetch(
        `${API_URL}/${basePath()}/placa/${encodeURIComponent(plate)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const records = await response.json();

      if (!Array.isArray(records)) {
        throw new Error('Resposta inesperada da API.');
      }

      // Mais recente primeiro
      records.sort((a, b) =>
        (b.dataHora || '').localeCompare(a.dataHora || '') ||
        (b.id || 0) - (a.id || 0)
      );

      showResult(records[0]);

      status(
        'consultationStatus',
        records.length
          ? 'Último registro encontrado.'
          : 'Nenhum registro encontrado.',
        records.length > 0
      );

    } catch (error) {
      console.error(error);
      status(
        'consultationStatus',
        'Erro ao consultar. Verifique se o backend está ligado.'
      );
    }
  });

  // Pré-visualização das fotos
  function renderPhotos() {
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    previewUrls = [];
    preview.replaceChildren();

    files.forEach((file, index) => {
      const item = document.createElement('div');
      item.className = 'preview-item';

      const image = document.createElement('img');
      const url = URL.createObjectURL(file);
      previewUrls.push(url);

      image.src = url;
      image.alt = `Prévia da foto ${index + 1}`;

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'remove-photo';
      remove.textContent = '×';
      remove.setAttribute(
        'aria-label',
        `Remover foto ${index + 1}`
      );

      remove.addEventListener('click', () => {
        files.splice(index, 1);
        renderPhotos();
      });

      item.append(image, remove);
      preview.appendChild(item);
    });

    $('photoCount').textContent = files.length
      ? `${files.length} foto(s) selecionada(s)`
      : 'Nenhuma foto selecionada';
  }

  photoInput.addEventListener('change', () => {
    const chosen = Array.from(photoInput.files);

    if (chosen.length > 10) {
      status(
        'uploadStatus',
        'Limite de 10 fotos; apenas as primeiras foram selecionadas.'
      );
    } else {
      $('uploadStatus').textContent = '';
    }

    files = chosen.slice(0, 10);
    renderPhotos();
  });

  // Enviar checklist ou conferência
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const plate = $('plate')
      .value.trim().toUpperCase().replace('-', '');

    const notes = $('notes').value.trim();

    if (!plate) {
      return status('uploadStatus', 'Informe a placa.');
    }

    if (!files.length) {
      return status('uploadStatus', 'Selecione pelo menos uma foto.');
    }

    if (files.some((file) =>
      !['image/jpeg', 'image/png'].includes(file.type) ||
      file.size > 5 * 1024 * 1024 ||
      !file.size
    )) {
      return status(
        'uploadStatus',
        'Envie JPG/PNG de até 5 MB por foto.'
      );
    }

    const checklist = isChecklist();
    const button = form.querySelector('[type="submit"]');

    button.disabled = true;
    $('uploadStatus').textContent = 'Enviando...';

    try {
      let endpoint = `${API_URL}/${basePath()}`;
      let body;
      const headers = {};

      if (checklist) {
        // Envia fotos para o backend
 endpoint += '/upload';

  body = new FormData();
  body.append('placa', plate);
  body.append('observacoes', notes);

   files.forEach(file => {
    body.append('fotos', file);
});
      } else {
        // Conferência ainda não tem upload de fotos
        body = JSON.stringify({
          placa: plate,
          observacoes: notes
        });

        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body
      });

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}: ${await response.text()}`
        );
      }

      status(
        'uploadStatus',
        checklist
          ? `Checklist da placa ${plate} salvo com ${files.length} foto(s)!`
          : `Conferência da placa ${plate} salva sem fotos (upload ainda não implementado).`,
        true
      );

      form.reset();
      files = [];
      renderPhotos();

    } catch (error) {
      console.error(error);

      status(
        'uploadStatus',
        'Não foi possível salvar. Veja o console (F12).'
      );

    } finally {
      button.disabled = false;
    }
  });
}
