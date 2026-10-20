
const API_URL = 'http://localhost:8080';
const $ = (id) => document.getElementById(id);

// LOGIN 


if ($('loginForm')) {
    $('loginForm').addEventListener('submit', async (event) => {
        event.preventDefault();

        const username = $('user').value.trim();
        const senha = $('password').value;
        const status = $('statusMessage');

        if (!username || !senha) {
            status.textContent = 'Preencha usuário e senha.';
            status.style.color = '#d94c4c';
            return;
        }

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, senha })
            });

            if (!response.ok) {
                status.textContent = 'Usuário ou senha inválidos.';
                status.style.color = '#d94c4c';
                return;
            }

            window.location.href = 'system.html';

        } catch (error) {
            console.error(error);
            status.textContent = 'Erro ao conectar ao servidor.';
            status.style.color = '#d94c4c';
        }
    });
}

if ($('uploadForm')) {

    async function verificarLogin() {
        try {
            const response = await fetch(`${API_URL}/auth/me`, {
                credentials: 'include'
            });

            if (!response.ok) {
                window.location.replace('index.html');
            }
        } catch (error) {
            window.location.replace('index.html');
        }
    }

    verificarLogin();
}


// CHECKLIST E CONFERÊNCIA
if ($('uploadForm')) {

   
    const form = $('uploadForm');
    const photoInput = $('photos');
    const preview = $('photoPreview');
    const options = document.querySelectorAll('[data-action]');

    let action = 'send-checklist';
    let files = [];
    let previewUrls = [];

    const isChecklist = () => action.endsWith('checklist');

    const endpoint = () =>
        isChecklist() ? 'checklists' : 'conferencias';

    const tipo = () =>
        isChecklist() ? 'Checklist' : 'Conferência';

    const result = document.createElement('div');
    result.id = 'consultaResultado';
    result.className = 'consulta-resultado';

    $('consultationPanel').appendChild(result);

    // MENSAGENS
    function status(id, message, success = false) {
        $(id).textContent = message;
        $(id).style.color = success ? '#1ea672' : '#d94c4c';
    }

    // TROCAR OPÇÃO DO MENU
    function changeAction(next) {
        action = next;

        const consulting = action.startsWith('consult-');

        options.forEach(option => {
            option.classList.toggle(
                'active',
                option.dataset.action === action
            );
        });

        $('consultationPanel').hidden = !consulting;
        form.hidden = consulting;

        const intro = document.querySelector('.system-intro');
        if (intro) intro.hidden = consulting;

        $('consultationTitle').textContent =
            `Consultar ${tipo().toLowerCase()}`;

        $('uploadTitle').textContent = 'Fotos e placa';

        $('uploadDescription').textContent =
            `Informe a placa e anexe as fotos de ${tipo().toLowerCase()}.`;

        $('photoLabel').textContent =
            `Fotos de ${tipo().toLowerCase()}`;

        $('consultationStatus').textContent = '';
        $('uploadStatus').textContent = '';

        result.replaceChildren();
    }

    options.forEach(option => {
        option.addEventListener('click', () => {
            changeAction(option.dataset.action);
        });
    });

    // FORMATAR DATA E HORA
    function formatDate(value) {
        if (!value) {
            return ['Não informada', 'Não informada'];
        }

        const match = String(value).match(
            /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/
        );

        // LocalDateTime do Java sem fuso horário
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

    // MOSTRAR ÚLTIMO REGISTRO
    function showResult(record) {
        result.replaceChildren();

        if (!record) return;

        const [date, time] = formatDate(record.dataHora);

        const heading = document.createElement('div');
        heading.className = 'resultado-header';
        heading.textContent = `ÚLTIMO(A) ${tipo().toUpperCase()}`;

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

        // OBSERVAÇÕES
        const notes = document.createElement('div');
        notes.className = 'resultado-observacao';

        const label = document.createElement('small');
        label.textContent = 'OBSERVAÇÕES';

        const paragraph = document.createElement('p');
        paragraph.textContent =
            record.observacoes || 'Nenhuma observação registrada.';

        notes.append(label, paragraph);
        result.appendChild(notes);

        // FOTOS DO CHECKLIST OU CONFERÊNCIA
        const fotos = Array.isArray(record.fotos)
            ? record.fotos
            : [];

        if (fotos.length > 0) {
            const gallery = document.createElement('div');
            gallery.className = 'galeria-checklist';

            const title = document.createElement('h3');
            title.textContent = `Fotos de ${tipo().toLowerCase()}`;

            gallery.appendChild(title);

            fotos.forEach((foto, index) => {
                if (!foto.url) return;

                const link = document.createElement('a');
                link.href = foto.url;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';

                const img = document.createElement('img');
                img.src = foto.url;
                img.alt = `Foto ${index + 1}`;
                img.loading = 'lazy';

                link.appendChild(img);
                gallery.appendChild(link);
            });

            result.appendChild(gallery);
        }
    }

    // CONSULTAR CHECKLIST OU CONFERÊNCIA
    $('consultationButton').addEventListener('click', async () => {
        const plate = $('consultationPlate').value
            .trim()
            .toUpperCase()
            .replace(/-/g, '');

        if (!plate) {
            return status(
                'consultationStatus',
                'Informe a placa.'
            );
        }

        result.replaceChildren();
        $('consultationStatus').textContent = 'Consultando...';

        try {
            const response = await fetch(
                `${API_URL}/${endpoint()}/placa/${encodeURIComponent(plate)}`
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const records = await response.json();

            if (!Array.isArray(records)) {
                throw new Error('Resposta inválida da API.');
            }

            // Ordena pelo registro mais recente
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
                'Erro ao consultar. Verifique o backend.'
            );
        }
    });

    // PRÉ-VISUALIZAÇÃO DAS FOTOS
    function renderPhotos() {
        previewUrls.forEach(url => URL.revokeObjectURL(url));
        previewUrls = [];

        preview.replaceChildren();

        files.forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'preview-item';

            const image = document.createElement('img');
            const url = URL.createObjectURL(file);

            previewUrls.push(url);
            image.src = url;
            image.alt = `Foto ${index + 1}`;

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

        files = chosen.slice(0, 10);
        renderPhotos();

        if (chosen.length > 10) {
            status(
                'uploadStatus',
                'Máximo de 10 fotos por envio.'
            );
        } else {
            $('uploadStatus').textContent = '';
        }
    });

    // ENVIAR CHECKLIST OU CONFERÊNCIA
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const plate = $('plate').value
            .trim()
            .toUpperCase()
            .replace(/-/g, '');

        const notes = $('notes').value.trim();

        if (!plate) {
            return status('uploadStatus', 'Informe a placa.');
        }

        if (!files.length) {
            return status(
                'uploadStatus',
                'Selecione pelo menos uma foto.'
            );
        }

        if (files.some(file =>
            !['image/jpeg', 'image/png'].includes(file.type) ||
            file.size === 0 ||
            file.size > 5 * 1024 * 1024
        )) {
            return status(
                'uploadStatus',
                'Envie imagens JPG ou PNG de até 5 MB.'
            );
        }

        const button = form.querySelector('[type="submit"]');
        if (button) button.disabled = true;

        $('uploadStatus').textContent = 'Enviando...';

        try {
            // MESMO FORMATO PARA CHECKLIST E CONFERÊNCIA
            const body = new FormData();

            body.append('placa', plate);
            body.append('observacoes', notes);

            files.forEach(file => {
                body.append('fotos', file);
            });

            const response = await fetch(
                `${API_URL}/${endpoint()}/upload`,
                {
                    method: 'POST',
                    credentials: 'include',
                    body
                }
            );

            if (!response.ok) {
                throw new Error(
                    `HTTP ${response.status}: ${await response.text()}`
                );
            }

            status(
                'uploadStatus',
                `${tipo()} da placa ${plate} salvo com ${files.length} foto(s)!`,
                true
            );

            form.reset();
            files = [];
            renderPhotos();

        } catch (error) {
            console.error(error);

            status(
                'uploadStatus',
                'Erro ao enviar. Verifique o console (F12).'
            );

        } finally {
            if (button) button.disabled = false;
        }
    });
}
