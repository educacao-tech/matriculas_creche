/**
 * Painel Administrativo Avançado
 * Secretaria Municipal de Educação de Batatais
 */

(function() {
    'use strict';

    const STORAGE_KEY = 'portal_matriculas_config';
    const SESSION_AUTH_KEY = 'portal_admin_auth';
    const LOCAL_AUTH_KEY = 'portal_admin_auth_local';
    const GH_TOKEN_KEY = 'portal_admin_github_token';
    const GH_REPO_KEY = 'portal_admin_github_repo';
    const GH_BRANCH_KEY = 'portal_admin_github_branch';

    // Estado geral
    let configState = null;
    let filtroStatus = 'todos'; // 'todos' | 'ativos' | 'desabilitados'
    let buscaTexto = '';
    let previewAtiva = true;

    // Paleta de temas disponíveis
    const TEMAS_DISPONIVEIS = [
        { id: 'creche', nome: 'Azul (Creche)', cor: '#2563eb', bg: '#eff6ff' },
        { id: 'espera', nome: 'Âmbar (Espera)', cor: '#d97706', bg: '#fffbeb' },
        { id: 'atendidos', nome: 'Verde (Atendidos)', cor: '#059669', bg: '#ecfdf5' },
        { id: 'criterios', nome: 'Roxo (Critérios)', cor: '#7c3aed', bg: '#f5f3ff' },
        { id: 'eief', nome: 'Coral (EI e EF)', cor: '#e11d48', bg: '#fff1f2' },
        { id: 'transporte', nome: 'Ciano (Transporte)', cor: '#0284c7', bg: '#f0f9ff' },
        { id: 'merenda', nome: 'Verde (Alimentação)', cor: '#16a34a', bg: '#f0fdf4' },
        { id: 'geral', nome: 'Neutro (Geral)', cor: '#475569', bg: '#f8fafc' }
    ];

    // Ícones populares recomendados
    const ICONES_SUGERIDOS = [
        { icone: 'fa-solid fa-file-pen', label: 'Inscrição / Lápis' },
        { icone: 'fa-solid fa-list-ol', label: 'Lista Numerada' },
        { icone: 'fa-solid fa-child-reaching', label: 'Criança / Vagas' },
        { icone: 'fa-solid fa-gavel', label: 'Regras / Balança' },
        { icone: 'fa-solid fa-school', label: 'Escola / Unidade' },
        { icone: 'fa-solid fa-van-shuttle', label: 'Transporte Escolar' },
        { icone: 'fa-solid fa-utensils', label: 'Merenda Escolar' },
        { icone: 'fa-solid fa-calendar-days', label: 'Calendário Letivo' },
        { icone: 'fa-solid fa-file-lines', label: 'Documento / Edital' },
        { icone: 'fa-solid fa-circle-question', label: 'Dúvidas / FAQ' }
    ];

    document.addEventListener('DOMContentLoaded', init);

    function init() {
        carregarConfiguracao();
        configurarAutenticacao();
        configurarBotoesGlobais();
        configurarToolbarBusca();
        configurarModais();
        configurarImportExport();
        configurarIntegracaoGitHub();
    }

    // =========================================================================
    // 1. CARREGAMENTO E PERSISTÊNCIA DA CONFIGURAÇÃO
    // =========================================================================
    function carregarConfiguracao() {
        const salvo = localStorage.getItem(STORAGE_KEY);
        if (salvo) {
            try {
                configState = JSON.parse(salvo);
            } catch (e) {
                console.error("Erro ao ler LocalStorage:", e);
                configState = JSON.parse(JSON.stringify(window.PORTAL_CONFIG || {}));
            }
        } else if (window.PORTAL_CONFIG) {
            configState = JSON.parse(JSON.stringify(window.PORTAL_CONFIG));
        } else {
            configState = { atalhos: [] };
        }

        // Garante integridade dos campos padrão
        if (!configState.anoLetivo) configState.anoLetivo = '2027';
        if (!configState.tituloHero) configState.tituloHero = 'Painel de Matrículas e Vagas';
        if (!configState.subtituloHero) configState.subtituloHero = 'Acesso unificado para solicitação de vagas, consulta de listas de espera e acompanhamento das convocações das creches e escolas municipais.';
        if (!configState.senhaAdmin) configState.senhaAdmin = 'educacao2026';
        if (!Array.isArray(configState.atalhos)) configState.atalhos = [];
    }

    let timerSalvar = null;
    function autoSalvar() {
        clearTimeout(timerSalvar);
        timerSalvar = setTimeout(() => {
            salvarConfiguracao(false);
            atualizarPreviaAoVivo();
        }, 200);
    }

    function salvarConfiguracao(notificar = true) {
        // Atualiza campos gerais
        const inputAno = document.getElementById('config-ano');
        const inputTitulo = document.getElementById('config-titulo-hero');
        const inputSubtitulo = document.getElementById('config-subtitulo-hero');
        const inputSenha = document.getElementById('config-senha');

        if (inputAno) configState.anoLetivo = inputAno.value.trim();
        if (inputTitulo) configState.tituloHero = inputTitulo.value.trim();
        if (inputSubtitulo) configState.subtituloHero = inputSubtitulo.value.trim();
        if (inputSenha && inputSenha.value.trim()) {
            configState.senhaAdmin = inputSenha.value.trim();
        }

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(configState));
            atualizarContadoresNavbar();
            atualizarPreviaAoVivo();
            if (notificar) {
                mostrarToast("Alterações salvas com sucesso!");
            }
        } catch (e) {
            console.error("Erro ao salvar:", e);
            if (notificar) alert("Erro ao salvar configurações no navegador.");
        }
    }

    // =========================================================================
    // 2. AUTENTICAÇÃO E SESSÃO
    // =========================================================================
    function configurarAutenticacao() {
        const loginOverlay = document.getElementById('login-overlay');
        const loginForm = document.getElementById('login-form');
        const inputSenha = document.getElementById('input-senha');
        const loginErro = document.getElementById('login-erro');
        const checkLembrar = document.getElementById('check-lembrar');
        const btnTogglePwd = document.getElementById('btn-toggle-pwd');

        // Toggle mostrar/ocultar senha no login
        if (btnTogglePwd) {
            btnTogglePwd.addEventListener('click', function() {
                const tipoAtual = inputSenha.getAttribute('type');
                if (tipoAtual === 'password') {
                    inputSenha.setAttribute('type', 'text');
                    btnTogglePwd.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
                } else {
                    inputSenha.setAttribute('type', 'password');
                    btnTogglePwd.innerHTML = '<i class="fa-solid fa-eye"></i>';
                }
            });
        }

        // Verifica autenticação prévia
        const authSession = sessionStorage.getItem(SESSION_AUTH_KEY) === 'true';
        const authLocal = localStorage.getItem(LOCAL_AUTH_KEY) === 'true';

        if (authSession || authLocal) {
            loginOverlay.style.display = 'none';
            renderizarPainel();
        } else {
            loginOverlay.style.display = 'flex';
            setTimeout(() => inputSenha.focus(), 100);
        }

        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const senhaCorreta = configState.senhaAdmin || "educacao2026";
            if (inputSenha.value.trim() === senhaCorreta) {
                if (checkLembrar && checkLembrar.checked) {
                    localStorage.setItem(LOCAL_AUTH_KEY, 'true');
                } else {
                    sessionStorage.setItem(SESSION_AUTH_KEY, 'true');
                }
                loginOverlay.style.display = 'none';
                loginErro.style.display = 'none';
                renderizarPainel();
                mostrarToast("Autenticado com sucesso!");
            } else {
                loginErro.style.display = 'block';
                inputSenha.classList.add('is-invalid');
                inputSenha.focus();
            }
        });

        // Botão Logout
        const btnLogout = document.getElementById('btn-logout');
        if (btnLogout) {
            btnLogout.addEventListener('click', function() {
                sessionStorage.removeItem(SESSION_AUTH_KEY);
                localStorage.removeItem(LOCAL_AUTH_KEY);
                window.location.reload();
            });
        }
    }

    // =========================================================================
    // 3. RENDERIZAÇÃO DA LISTA DE ATALHOS
    // =========================================================================
    function renderizarPainel() {
        const container = document.getElementById('manage-list');
        container.innerHTML = '';

        // Preenche campos de configurações gerais
        const inputAno = document.getElementById('config-ano');
        const inputTitulo = document.getElementById('config-titulo-hero');
        const inputSubtitulo = document.getElementById('config-subtitulo-hero');
        const inputSenha = document.getElementById('config-senha');

        if (inputAno) inputAno.value = configState.anoLetivo || '2027';
        if (inputTitulo) inputTitulo.value = configState.tituloHero || 'Painel de Matrículas e Vagas';
        if (inputSubtitulo) inputSubtitulo.value = configState.subtituloHero || '';
        if (inputSenha) inputSenha.value = configState.senhaAdmin || 'educacao2026';

        // Atualiza contadores
        atualizarContadoresNavbar();

        // Filtra atalhos
        const atalhosFiltrados = configState.atalhos.map((item, indexOriginal) => ({ item, indexOriginal })).filter(({ item }) => {
            // Filtro por status
            if (filtroStatus === 'ativos' && !item.ativo) return false;
            if (filtroStatus === 'desabilitados' && item.ativo) return false;

            // Filtro por texto
            if (buscaTexto) {
                const termo = buscaTexto.toLowerCase();
                const titulo = (item.titulo || '').toLowerCase();
                const desc = (item.descricao || '').toLowerCase();
                const url = (item.url || '').toLowerCase();
                const badge = (item.badge || '').toLowerCase();
                return titulo.includes(termo) || desc.includes(termo) || url.includes(termo) || badge.includes(termo);
            }

            return true;
        });

        if (atalhosFiltrados.length === 0) {
            container.innerHTML = `
                <div style="background: #ffffff; border-radius: 16px; border: 1px dashed #cbd5e1; padding: 3rem 1.5rem; text-align: center; color: #64748b;">
                    <i class="fa-solid fa-magnifying-glass" style="font-size: 2.2rem; color: #94a3b8; margin-bottom: 0.75rem; display: block;"></i>
                    <h3 style="font-size: 1.15rem; color: #1e293b; margin-bottom: 0.35rem;">Nenhum atalho encontrado</h3>
                    <p style="font-size: 0.9rem;">Tente ajustar o termo de busca ou o filtro de status acima.</p>
                </div>
            `;
        } else {
            atalhosFiltrados.forEach(({ item, indexOriginal }, iExibicao) => {
                const cardEl = criarCardAtalho(item, indexOriginal, iExibicao, atalhosFiltrados.length);
                container.appendChild(cardEl);
            });
        }

        atualizarPreviaAoVivo();
    }

    function atualizarContadoresNavbar() {
        const total = (configState.atalhos || []).length;
        const ativos = (configState.atalhos || []).filter(a => a.ativo).length;
        const desativados = total - ativos;

        const elBadgeAtivos = document.getElementById('stat-ativos');
        const elBadgeDesativados = document.getElementById('stat-desativados');
        const elTotalGeral = document.getElementById('count-total-atalhos');

        if (elBadgeAtivos) elBadgeAtivos.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${ativos} ativos`;
        if (elBadgeDesativados) elBadgeDesativados.innerHTML = `<i class="fa-solid fa-circle-pause"></i> ${desativados} ocultos`;
        if (elTotalGeral) elTotalGeral.textContent = `${total} cadastrados`;
    }

    // =========================================================================
    // 4. CRIAÇÃO DE CADA CARD COM CONTROLES COMPLETOS
    // =========================================================================
    function criarCardAtalho(item, index, iExibicao, totalExibidos) {
        const card = document.createElement('div');
        card.className = `manage-card ${item.ativo ? '' : 'is-disabled'}`;
        card.id = `manage-card-${index}`;

        // Obtém cores do tema
        const temaObj = TEMAS_DISPONIVEIS.find(t => t.id === item.tema) || TEMAS_DISPONIVEIS[0];
        card.style.setProperty('--card-color', temaObj.cor);
        card.style.setProperty('--card-light-bg', temaObj.bg);

        // Análise inteligente da URL
        const infoLink = analisarTipoLink(item.url);

        card.innerHTML = `
            <div class="card-theme-stripe"></div>

            <div class="manage-card-top" data-target="body-${index}">
                <div class="manage-card-identity">
                    <!-- Controles de Ordem (Subir / Descer) -->
                    <div class="reorder-controls" onclick="event.stopPropagation()">
                        <button type="button" class="btn-reorder btn-reorder-up" data-index="${index}" title="Mover para cima" ${index === 0 ? 'disabled' : ''}>
                            <i class="fa-solid fa-chevron-up"></i>
                        </button>
                        <button type="button" class="btn-reorder btn-reorder-down" data-index="${index}" title="Mover para baixo" ${index === configState.atalhos.length - 1 ? 'disabled' : ''}>
                            <i class="fa-solid fa-chevron-down"></i>
                        </button>
                    </div>

                    <div class="manage-icon-avatar" id="avatar-${index}">
                        <i class="${item.icone || 'fa-solid fa-link'}" aria-hidden="true"></i>
                    </div>

                    <div class="manage-title-group">
                        <div class="manage-title-preview">
                            <span id="preview-title-${index}">${item.titulo || 'Sem Título'}</span>
                            ${item.destaque ? '<span title="Em Destaque" style="color: #f59e0b; font-size: 0.85rem;"><i class="fa-solid fa-star"></i></span>' : ''}
                        </div>
                        <div class="manage-meta-badges">
                            <span class="manage-tag-preview" id="preview-badge-${index}">${item.badge || 'Geral'}</span>
                            <span class="smart-link-badge ${infoLink.badgeClass}" id="smart-badge-${index}">
                                <i class="${infoLink.icon}"></i> ${infoLink.label}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="manage-card-actions-top" onclick="event.stopPropagation()">
                    <!-- Interruptor Habilitar / Desabilitar -->
                    <label class="switch-control" title="Clique para habilitar ou ocultar este botão na página pública">
                        <span class="switch-label ${item.ativo ? 'status-active' : 'status-inactive'}" id="label-status-${index}">
                            ${item.ativo ? '<i class="fa-solid fa-circle-check"></i> Habilitado' : '<i class="fa-solid fa-circle-xmark"></i> Oculto'}
                        </span>
                        <input type="checkbox" class="switch-input" data-index="${index}" ${item.ativo ? 'checked' : ''}>
                        <span class="switch-slider"></span>
                    </label>

                    <button type="button" class="btn-toggle-expand" data-target="body-${index}" title="Recolher / Expandir detalhes">
                        <i class="fa-solid fa-chevron-down"></i>
                    </button>
                </div>
            </div>

            <!-- Corpo dos Campos Editáveis -->
            <div class="manage-card-body" id="body-${index}">
                <!-- Linha 1: URL de Destino e Etiqueta -->
                <div class="form-grid-row">
                    <div class="form-group">
                        <label class="form-label" for="url-${index}">
                            <i class="fa-solid fa-link"></i> Link de Destino (URL)
                        </label>
                        <div class="url-input-wrapper">
                            <input type="url" id="url-${index}" class="form-input input-url" data-index="${index}" value="${item.url || ''}" placeholder="https://..." required>
                            <a href="${item.url || '#'}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm btn-test-url" id="btn-test-${index}" title="Testar link em nova aba">
                                <i class="fa-solid fa-arrow-up-right-from-square"></i> Testar
                            </a>
                        </div>
                        <span class="form-help" id="help-url-${index}">Cole o link de compartilhamento da Planilha Google, formulário ou documento.</span>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="badge-${index}">
                            <i class="fa-solid fa-tag"></i> Etiqueta de Categoria (Badge)
                        </label>
                        <input type="text" id="badge-${index}" class="form-input input-badge" data-index="${index}" value="${item.badge || ''}" placeholder="Ex: 0 a 3 anos, Fila Pública">
                        <span class="form-help">Pequeno selo de identificação visível no topo do card.</span>
                    </div>
                </div>

                <!-- Linha 2: Título e Texto do Botão -->
                <div class="form-grid-row">
                    <div class="form-group">
                        <label class="form-label" for="title-${index}">
                            <i class="fa-solid fa-heading"></i> Título Principal do Atalho
                        </label>
                        <input type="text" id="title-${index}" class="form-input input-title" data-index="${index}" value="${item.titulo || ''}" required>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="btntext-${index}">
                            <i class="fa-solid fa-hand-pointer"></i> Texto de Ação do Botão
                        </label>
                        <input type="text" id="btntext-${index}" class="form-input input-btntext" data-index="${index}" value="${item.textoBotao || 'Acessar'}">
                    </div>
                </div>

                <!-- Linha 3: Descrição Explicativa aos Pais -->
                <div class="form-group" style="margin-bottom: 1.25rem;">
                    <label class="form-label" for="desc-${index}">
                        <i class="fa-solid fa-align-left"></i> Descrição Explicativa
                    </label>
                    <input type="text" id="desc-${index}" class="form-input input-desc" data-index="${index}" value="${item.descricao || ''}" placeholder="Orientações breves sobre o que o cidadão encontrará...">
                </div>

                <!-- Linha 4: Seleção de Tema Visual e Ícone -->
                <div class="form-grid-row">
                    <div class="form-group">
                        <label class="form-label">
                            <i class="fa-solid fa-palette"></i> Cor Temática
                        </label>
                        <select id="theme-${index}" class="form-select input-theme" data-index="${index}">
                            ${TEMAS_DISPONIVEIS.map(t => `<option value="${t.id}" ${item.tema === t.id ? 'selected' : ''}>${t.nome}</option>`).join('')}
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="icon-${index}">
                            <i class="fa-solid fa-icons"></i> Ícone (Classe Font Awesome)
                        </label>
                        <div style="display: flex; gap: 0.5rem;">
                            <input type="text" id="icon-${index}" class="form-input input-icon" data-index="${index}" value="${item.icone || 'fa-solid fa-link'}" placeholder="fa-solid fa-...">
                            <select class="form-select select-icon-preset" data-index="${index}" style="max-width: 170px;">
                                <option value="">Ícones Sugeridos...</option>
                                ${ICONES_SUGERIDOS.map(ic => `<option value="${ic.icone}">${ic.label}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Barra Inferior de Ações do Card -->
                <div class="card-bottom-actions">
                    <div class="card-bottom-left">
                        <label class="checkbox-label" title="Dá maior destaque visual ao card">
                            <input type="checkbox" class="input-destaque" data-index="${index}" ${item.destaque ? 'checked' : ''}>
                            <span style="font-size: 0.86rem; font-weight: 600; color: var(--text-secondary);">
                                <i class="fa-solid fa-star" style="color: #f59e0b;"></i> Destacar este card no portal
                            </span>
                        </label>
                    </div>
                    <div class="card-bottom-right">
                        <button type="button" class="btn btn-secondary btn-sm btn-duplicar" data-index="${index}" title="Duplicar atalho">
                            <i class="fa-solid fa-copy"></i> Duplicar
                        </button>
                        <button type="button" class="btn btn-danger-outline btn-sm btn-excluir" data-index="${index}" title="Excluir atalho">
                            <i class="fa-solid fa-trash-can"></i> Excluir
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Eventos do Switch Ativar/Desativar
        const switchInput = card.querySelector('.switch-input');
        switchInput.addEventListener('change', function() {
            const idx = parseInt(this.getAttribute('data-index'), 10);
            const ativo = this.checked;
            configState.atalhos[idx].ativo = ativo;

            const labelStatus = document.getElementById(`label-status-${idx}`);
            if (ativo) {
                card.classList.remove('is-disabled');
                labelStatus.className = 'switch-label status-active';
                labelStatus.innerHTML = '<i class="fa-solid fa-circle-check"></i> Habilitado';
            } else {
                card.classList.add('is-disabled');
                labelStatus.className = 'switch-label status-inactive';
                labelStatus.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Oculto';
            }

            atualizarContadoresNavbar();
            autoSalvar();
        });

        // Evento Expandir/Recolher ao clicar no topo
        const cardTop = card.querySelector('.manage-card-top');
        const cardBody = card.querySelector('.manage-card-body');
        const btnToggleExpand = card.querySelector('.btn-toggle-expand');
        
        function toggleExpand() {
            const isCol = cardBody.classList.toggle('is-collapsed');
            btnToggleExpand.classList.toggle('is-collapsed', isCol);
        }
        cardTop.addEventListener('click', toggleExpand);
        btnToggleExpand.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleExpand();
        });

        // Reordenação Subir
        const btnUp = card.querySelector('.btn-reorder-up');
        if (btnUp) {
            btnUp.addEventListener('click', () => moverAtalho(index, -1));
        }

        // Reordenação Descer
        const btnDown = card.querySelector('.btn-reorder-down');
        if (btnDown) {
            btnDown.addEventListener('click', () => moverAtalho(index, 1));
        }

        // Evento de URL
        const inputUrl = card.querySelector('.input-url');
        const btnTest = card.querySelector('.btn-test-url');
        inputUrl.addEventListener('input', function() {
            const idx = parseInt(this.getAttribute('data-index'), 10);
            const novaUrl = this.value;
            configState.atalhos[idx].url = novaUrl;
            btnTest.href = novaUrl || '#';

            // Atualiza badge inteligente de link
            const info = analisarTipoLink(novaUrl);
            const smartBadge = document.getElementById(`smart-badge-${idx}`);
            if (smartBadge) {
                smartBadge.className = `smart-link-badge ${info.badgeClass}`;
                smartBadge.innerHTML = `<i class="${info.icon}"></i> ${info.label}`;
            }
            autoSalvar();
        });

        // Evento de Título
        const inputTitle = card.querySelector('.input-title');
        inputTitle.addEventListener('input', function() {
            const idx = parseInt(this.getAttribute('data-index'), 10);
            configState.atalhos[idx].titulo = this.value;
            const prev = document.getElementById(`preview-title-${idx}`);
            if (prev) prev.textContent = this.value || 'Sem Título';
            autoSalvar();
        });

        // Evento de Badge
        const inputBadge = card.querySelector('.input-badge');
        inputBadge.addEventListener('input', function() {
            const idx = parseInt(this.getAttribute('data-index'), 10);
            configState.atalhos[idx].badge = this.value;
            const prev = document.getElementById(`preview-badge-${idx}`);
            if (prev) prev.textContent = this.value || 'Geral';
            autoSalvar();
        });

        // Evento de Texto do Botão
        const inputBtnText = card.querySelector('.input-btntext');
        inputBtnText.addEventListener('input', function() {
            const idx = parseInt(this.getAttribute('data-index'), 10);
            configState.atalhos[idx].textoBotao = this.value;
            autoSalvar();
        });

        // Evento de Descrição
        const inputDesc = card.querySelector('.input-desc');
        inputDesc.addEventListener('input', function() {
            const idx = parseInt(this.getAttribute('data-index'), 10);
            configState.atalhos[idx].descricao = this.value;
            autoSalvar();
        });

        // Evento de Tema
        const selectTheme = card.querySelector('.input-theme');
        selectTheme.addEventListener('change', function() {
            const idx = parseInt(this.getAttribute('data-index'), 10);
            const novoTema = this.value;
            configState.atalhos[idx].tema = novoTema;
            const tObj = TEMAS_DISPONIVEIS.find(t => t.id === novoTema) || TEMAS_DISPONIVEIS[0];
            card.style.setProperty('--card-color', tObj.cor);
            card.style.setProperty('--card-light-bg', tObj.bg);
            autoSalvar();
        });

        // Evento de Ícone Manual
        const inputIcon = card.querySelector('.input-icon');
        const iconAvatar = card.querySelector('.manage-icon-avatar');
        inputIcon.addEventListener('input', function() {
            const idx = parseInt(this.getAttribute('data-index'), 10);
            configState.atalhos[idx].icone = this.value;
            if (iconAvatar) iconAvatar.innerHTML = `<i class="${this.value || 'fa-solid fa-link'}" aria-hidden="true"></i>`;
            autoSalvar();
        });

        // Evento de Ícone Sugerido (Dropdown)
        const selectIconPreset = card.querySelector('.select-icon-preset');
        selectIconPreset.addEventListener('change', function() {
            if (!this.value) return;
            const idx = parseInt(this.getAttribute('data-index'), 10);
            inputIcon.value = this.value;
            configState.atalhos[idx].icone = this.value;
            if (iconAvatar) iconAvatar.innerHTML = `<i class="${this.value}" aria-hidden="true"></i>`;
            this.value = '';
            autoSalvar();
        });

        // Evento de Destaque
        const checkDestaque = card.querySelector('.input-destaque');
        checkDestaque.addEventListener('change', function() {
            const idx = parseInt(this.getAttribute('data-index'), 10);
            configState.atalhos[idx].destaque = this.checked;
            autoSalvar();
        });

        // Duplicar Atalho
        const btnDuplicar = card.querySelector('.btn-duplicar');
        btnDuplicar.addEventListener('click', () => duplicarAtalho(index));

        // Excluir Atalho
        const btnExcluir = card.querySelector('.btn-excluir');
        btnExcluir.addEventListener('click', () => excluirAtalho(index));

        return card;
    }

    // =========================================================================
    // 5. OPERAÇÕES NOS ATALHOS (REORDENAR, DUPLICAR, EXCLUIR)
    // =========================================================================
    function moverAtalho(index, direcao) {
        const novoIndex = index + direcao;
        if (novoIndex < 0 || novoIndex >= configState.atalhos.length) return;

        const temp = configState.atalhos[index];
        configState.atalhos[index] = configState.atalhos[novoIndex];
        configState.atalhos[novoIndex] = temp;

        salvarConfiguracao(false);
        renderizarPainel();
        mostrarToast("Ordem dos atalhos atualizada!");
    }

    function duplicarAtalho(index) {
        const itemOriginal = configState.atalhos[index];
        const copia = JSON.parse(JSON.stringify(itemOriginal));
        copia.id = `btn-custom-${Date.now()}`;
        copia.titulo = `${copia.titulo} (Cópia)`;
        copia.ativo = false; // Cria desativado por precaução

        configState.atalhos.splice(index + 1, 0, copia);
        salvarConfiguracao(false);
        renderizarPainel();
        mostrarToast("Atalho duplicado com sucesso!");
    }

    function excluirAtalho(index) {
        const item = configState.atalhos[index];
        const confirmacao = confirm(`Deseja realmente excluir o atalho "${item.titulo}"?\nEsta ação não poderá ser desfeita.`);
        if (confirmacao) {
            configState.atalhos.splice(index, 1);
            salvarConfiguracao(false);
            renderizarPainel();
            mostrarToast("Atalho removido!");
        }
    }

    // Analisador inteligente de links Google
    function analisarTipoLink(url) {
        if (!url) {
            return { type: 'empty', label: 'Sem Link', icon: 'fa-solid fa-triangle-exclamation', badgeClass: 'badge-generic' };
        }
        const u = url.toLowerCase();
        if (u.includes('spreadsheets') || u.includes('docs.google.com/spreadsheets')) {
            return { type: 'sheets', label: 'Planilha Google', icon: 'fa-solid fa-file-excel', badgeClass: 'badge-sheets' };
        }
        if (u.includes('forms') || u.includes('docs.google.com/forms')) {
            return { type: 'forms', label: 'Google Forms', icon: 'fa-solid fa-file-lines', badgeClass: 'badge-forms' };
        }
        if (u.includes('drive.google.com')) {
            return { type: 'drive', label: 'Google Drive', icon: 'fa-brands fa-google-drive', badgeClass: 'badge-drive' };
        }
        if (u.includes('sites.google.com')) {
            return { type: 'sites', label: 'Google Sites', icon: 'fa-solid fa-globe', badgeClass: 'badge-drive' };
        }
        return { type: 'generic', label: 'Link Externo', icon: 'fa-solid fa-arrow-up-right-from-square', badgeClass: 'badge-generic' };
    }

    // =========================================================================
    // 6. PRÉVIA AO VIVO EM TEMPO REAL (LIVE PREVIEW)
    // =========================================================================
    function atualizarPreviaAoVivo() {
        const container = document.getElementById('preview-cards-container');
        if (!container) return;

        // Atualiza textos do Hero mock
        const prevHeroTitle = document.getElementById('preview-hero-title');
        const prevHeroSub = document.getElementById('preview-hero-subtitle');
        if (prevHeroTitle) prevHeroTitle.textContent = configState.tituloHero || 'Painel de Matrículas e Vagas';
        if (prevHeroSub) prevHeroSub.textContent = configState.subtituloHero || '';

        // Filtra apenas atalhos ativos
        const ativos = (configState.atalhos || []).filter(a => a.ativo !== false);

        if (ativos.length === 0) {
            container.innerHTML = `
                <div style="background: #ffffff; padding: 2rem 1rem; text-align: center; border-radius: 12px; border: 1px solid #e2e8f0; color: #94a3b8; font-size: 0.85rem;">
                    <i class="fa-solid fa-eye-slash" style="font-size: 1.8rem; margin-bottom: 0.5rem; display: block;"></i>
                    Nenhum atalho está ativo no momento.
                </div>
            `;
            return;
        }

        container.innerHTML = '';

        ativos.forEach(item => {
            const cardEl = document.createElement('div');
            cardEl.className = `service-card theme-${item.tema || 'creche'} ${item.destaque ? 'card-featured' : ''}`;
            cardEl.style.padding = '1.1rem';
            cardEl.style.borderRadius = '14px';

            cardEl.innerHTML = `
                <div class="card-header-area" style="margin-bottom: 0.6rem;">
                    <div class="card-icon-wrapper" style="width: 40px; height: 40px; font-size: 1.15rem;">
                        <i class="${item.icone || 'fa-solid fa-link'}" aria-hidden="true"></i>
                    </div>
                    <span class="card-badge" style="font-size: 0.68rem; padding: 0.2rem 0.5rem;">${item.badge || 'Acesso'}</span>
                </div>
                <div class="card-body-area" style="margin-bottom: 0.75rem;">
                    <h4 class="card-title" style="font-size: 1rem; margin-bottom: 0.3rem;">${item.titulo || 'Serviço'}</h4>
                    <p class="card-desc" style="font-size: 0.8rem; line-height: 1.4;">${item.descricao || ''}</p>
                </div>
                <div class="card-footer-area" style="padding-top: 0.6rem;">
                    <span class="card-action-text" style="font-size: 0.8rem;">${item.textoBotao || 'Acessar'}</span>
                    <span class="card-action-arrow" style="width: 26px; height: 26px; font-size: 0.75rem;">
                        <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    </span>
                </div>
            `;
            container.appendChild(cardEl);
        });
    }

    // =========================================================================
    // 7. BARRA DE BUSCA E FILTROS
    // =========================================================================
    function configurarToolbarBusca() {
        const inputBusca = document.getElementById('search-shortcuts');
        if (inputBusca) {
            inputBusca.addEventListener('input', function() {
                buscaTexto = this.value.trim();
                renderizarPainel();
            });
        }

        const botoesFiltro = document.querySelectorAll('.filter-btn');
        botoesFiltro.forEach(btn => {
            btn.addEventListener('click', function() {
                botoesFiltro.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                filtroStatus = this.getAttribute('data-filter');
                renderizarPainel();
            });
        });
    }

    // =========================================================================
    // 8. BOTOES GLOBAIS (PREVIA, SALVAR, RESTAURAR)
    // =========================================================================
    function configurarBotoesGlobais() {
        // Toggle da Prévia ao Vivo
        const btnTogglePreview = document.getElementById('btn-toggle-preview');
        const splitLayout = document.getElementById('admin-layout-split');
        if (btnTogglePreview && splitLayout) {
            btnTogglePreview.addEventListener('click', function() {
                previewAtiva = !previewAtiva;
                splitLayout.classList.toggle('preview-open', previewAtiva);
                btnTogglePreview.classList.toggle('active', previewAtiva);
                btnTogglePreview.innerHTML = previewAtiva ?
                    '<i class="fa-solid fa-eye-slash"></i> Ocultar Prévia' :
                    '<i class="fa-solid fa-eye"></i> Prévia ao Vivo';
            });
        }

        // Salvar Manualmente
        const btnSalvar = document.getElementById('btn-salvar');
        if (btnSalvar) {
            btnSalvar.addEventListener('click', () => salvarConfiguracao(true));
        }

        // Inputs das Configurações Gerais
        const inputsGerais = ['config-ano', 'config-titulo-hero', 'config-subtitulo-hero', 'config-senha'];
        inputsGerais.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', autoSalvar);
            }
        });

        // Toggle Exibir Senha nas configurações gerais
        const btnToggleConfigPwd = document.getElementById('btn-toggle-config-pwd');
        const inputConfigSenha = document.getElementById('config-senha');
        if (btnToggleConfigPwd && inputConfigSenha) {
            btnToggleConfigPwd.addEventListener('click', function() {
                const tipo = inputConfigSenha.getAttribute('type');
                if (tipo === 'password') {
                    inputConfigSenha.setAttribute('type', 'text');
                    btnToggleConfigPwd.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
                } else {
                    inputConfigSenha.setAttribute('type', 'password');
                    btnToggleConfigPwd.innerHTML = '<i class="fa-solid fa-eye"></i>';
                }
            });
        }

        // Restaurar Padrões Originais
        const btnRestaurar = document.getElementById('btn-restaurar');
        if (btnRestaurar) {
            btnRestaurar.addEventListener('click', function() {
                const certeza = confirm("Tem certeza de que deseja restaurar as configurações padrão de fábrica?\nTodas as alterações personalizadas não exportadas serão perdidas.");
                if (certeza) {
                    localStorage.removeItem(STORAGE_KEY);
                    carregarConfiguracao();
                    renderizarPainel();
                    mostrarToast("Configurações originais restauradas!");
                }
            });
        }
    }

    // =========================================================================
    // 9. MODAL "NOVO ATALHO" E MODAL "EXPORTAR"
    // =========================================================================
    function configurarModais() {
        // Modal Novo Atalho
        const btnNovo = document.getElementById('btn-novo-atalho');
        const modalNovo = document.getElementById('modal-novo-atalho');
        const btnFecharNovo = document.getElementById('modal-novo-close');
        const formNovo = document.getElementById('form-novo-atalho');

        if (btnNovo && modalNovo) {
            btnNovo.addEventListener('click', () => {
                formNovo.reset();
                modalNovo.classList.add('active');
                setTimeout(() => document.getElementById('novo-titulo').focus(), 100);
            });
        }

        if (btnFecharNovo && modalNovo) {
            btnFecharNovo.addEventListener('click', () => modalNovo.classList.remove('active'));
        }

        if (formNovo) {
            formNovo.addEventListener('submit', function(e) {
                e.preventDefault();
                const titulo = document.getElementById('novo-titulo').value.trim();
                const url = document.getElementById('novo-url').value.trim();
                const desc = document.getElementById('novo-desc').value.trim();
                const badge = document.getElementById('novo-badge').value.trim() || 'Serviço';
                const tema = document.getElementById('novo-tema').value || 'creche';
                const icone = document.getElementById('novo-icone').value.trim() || 'fa-solid fa-link';
                const textoBtn = document.getElementById('novo-btntext').value.trim() || 'Acessar';
                const destaque = document.getElementById('novo-destaque').checked;

                const novoItem = {
                    id: `btn-custom-${Date.now()}`,
                    chave: `custom_${Date.now()}`,
                    titulo: titulo,
                    descricao: desc,
                    url: url,
                    badge: badge,
                    icone: icone,
                    tema: tema,
                    textoBotao: textoBtn,
                    ativo: true,
                    destaque: destaque
                };

                configState.atalhos.push(novoItem);
                salvarConfiguracao(false);
                renderizarPainel();
                modalNovo.classList.remove('active');
                mostrarToast(`Atalho "${titulo}" criado com sucesso!`);
            });
        }

        // Modal Exportar
        const btnExportar = document.getElementById('btn-exportar');
        const modalExportar = document.getElementById('modal-exportar');
        const btnFecharExportar = document.getElementById('modal-exportar-close');
        const txtCode = document.getElementById('modal-code');
        const btnCopiar = document.getElementById('btn-copiar-codigo');
        const btnBaixar = document.getElementById('btn-baixar-arquivo');

        if (btnExportar && modalExportar) {
            btnExportar.addEventListener('click', function() {
                salvarConfiguracao(false);
                txtCode.value = gerarCodigoConfigJS();
                modalExportar.classList.add('active');
            });
        }

        if (btnFecharExportar && modalExportar) {
            btnFecharExportar.addEventListener('click', () => modalExportar.classList.remove('active'));
        }

        if (btnCopiar && txtCode) {
            btnCopiar.addEventListener('click', function() {
                txtCode.select();
                navigator.clipboard.writeText(txtCode.value).then(() => {
                    mostrarToast("Código copiado para a área de transferência!");
                }).catch(() => {
                    document.execCommand('copy');
                    mostrarToast("Código copiado!");
                });
            });
        }

        if (btnBaixar) {
            btnBaixar.addEventListener('click', function() {
                const codigo = gerarCodigoConfigJS();
                const blob = new Blob([codigo], { type: 'application/javascript;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'config.js';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                mostrarToast("Arquivo config.js baixado com sucesso!");
            });
        }

        // Fecha modal ao clicar no fundo
        window.addEventListener('click', function(e) {
            if (e.target === modalNovo) modalNovo.classList.remove('active');
            if (e.target === modalExportar) modalExportar.classList.remove('active');
        });
    }

    // =========================================================================
    // 10. IMPORTAR CONFIGURAÇÃO (FILE UPLOAD)
    // =========================================================================
    function configurarImportExport() {
        const inputUpload = document.getElementById('input-import-file');
        const btnImportar = document.getElementById('btn-importar-trigger');

        if (btnImportar && inputUpload) {
            btnImportar.addEventListener('click', () => inputUpload.click());

            inputUpload.addEventListener('change', function(e) {
                const arquivo = e.target.files[0];
                if (!arquivo) return;

                const reader = new FileReader();
                reader.onload = function(evt) {
                    try {
                        const conteudo = evt.target.result;
                        let objetoConfig = null;

                        // Tenta como JSON direto
                        if (conteudo.trim().startsWith('{')) {
                            objetoConfig = JSON.parse(conteudo);
                        } else if (conteudo.includes('window.PORTAL_CONFIG =')) {
                            // Extrai JSON de window.PORTAL_CONFIG
                            const jsonMatch = conteudo.match(/window\.PORTAL_CONFIG\s*=\s*({[\s\S]*?});/);
                            if (jsonMatch && jsonMatch[1]) {
                                objetoConfig = JSON.parse(jsonMatch[1]);
                            }
                        }

                        if (objetoConfig && Array.isArray(objetoConfig.atalhos)) {
                            configState = objetoConfig;
                            salvarConfiguracao(true);
                            renderizarPainel();
                            mostrarToast("Configuração importada com sucesso!");
                        } else {
                            alert("O arquivo fornecido não parece ser uma configuração válida.");
                        }
                    } catch (err) {
                        console.error("Erro ao importar arquivo:", err);
                        alert("Erro ao ler o arquivo. Certifique-se de carregar um config.js ou JSON válido.");
                    }
                    inputUpload.value = '';
                };
                reader.readAsText(arquivo);
            });
        }
    }

    // Gera o código limpo para o config.js
    function gerarCodigoConfigJS() {
        const jsonFormatado = JSON.stringify(configState, null, 4);
        return `/**
 * Configuração Padrão do Painel de Matrículas
 * Secretaria Municipal de Educação de Batatais
 * Atualizado via Painel Administrativo em: ${new Date().toLocaleString('pt-BR')}
 */

window.PORTAL_CONFIG = ${jsonFormatado};
`;
    }

    // =========================================================================
    // 11. INTEGRAÇÃO DIRETA COM O GITHUB (API REST)
    // =========================================================================
    function configurarIntegracaoGitHub() {
        const btnPublicarHero = document.getElementById('btn-publicar-github');
        const btnPublicarFloating = document.getElementById('btn-floating-github');
        const btnConfigGH = document.getElementById('btn-config-github');
        const modalGH = document.getElementById('modal-github-config');
        const btnFecharGH = document.getElementById('modal-github-close');
        const formGH = document.getElementById('form-github-config');
        const inputToken = document.getElementById('gh-token');
        const inputRepo = document.getElementById('gh-repo');
        const inputBranch = document.getElementById('gh-branch');
        const btnToggleToken = document.getElementById('btn-toggle-gh-token');
        const btnTestarGH = document.getElementById('btn-testar-gh');
        const statusMsg = document.getElementById('gh-status-msg');

        // Carrega valores salvos
        const tokenSalvo = localStorage.getItem(GH_TOKEN_KEY) || '';
        const repoSalvo = localStorage.getItem(GH_REPO_KEY) || (configState.githubRepo || 'educacao-tech/matriculas_creche');
        const branchSalva = localStorage.getItem(GH_BRANCH_KEY) || (configState.githubBranch || 'main');

        if (inputToken) inputToken.value = tokenSalvo;
        if (inputRepo) inputRepo.value = repoSalvo;
        if (inputBranch) inputBranch.value = branchSalva;

        // Toggle visibilidade do token
        if (btnToggleToken && inputToken) {
            btnToggleToken.addEventListener('click', function() {
                const tipo = inputToken.getAttribute('type');
                if (tipo === 'password') {
                    inputToken.setAttribute('type', 'text');
                    btnToggleToken.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
                } else {
                    inputToken.setAttribute('type', 'password');
                    btnToggleToken.innerHTML = '<i class="fa-solid fa-eye"></i>';
                }
            });
        }

        // Abrir Modal de Configuração
        function abrirModalGH() {
            if (statusMsg) statusMsg.style.display = 'none';
            modalGH.classList.add('active');
            setTimeout(() => inputToken.focus(), 100);
        }

        if (btnConfigGH) btnConfigGH.addEventListener('click', abrirModalGH);
        if (btnFecharGH) btnFecharGH.addEventListener('click', () => modalGH.classList.remove('active'));

        // Salvar Configuração do GitHub
        if (formGH) {
            formGH.addEventListener('submit', function(e) {
                e.preventDefault();
                const token = inputToken.value.trim();
                const repo = inputRepo.value.trim() || 'educacao-tech/matriculas_creche';
                const branch = inputBranch.value.trim() || 'main';

                localStorage.setItem(GH_TOKEN_KEY, token);
                localStorage.setItem(GH_REPO_KEY, repo);
                localStorage.setItem(GH_BRANCH_KEY, branch);

                configState.githubRepo = repo;
                configState.githubBranch = branch;
                salvarConfiguracao(false);

                modalGH.classList.remove('active');
                mostrarToast("Credenciais do GitHub salvas com sucesso!");
            });
        }

        // Testar Conexão com GitHub
        if (btnTestarGH) {
            btnTestarGH.addEventListener('click', async function() {
                const token = inputToken.value.trim();
                const repo = inputRepo.value.trim();

                if (!token) {
                    mostrarStatusGH("Informe um token antes de testar.", false);
                    return;
                }

                btnTestarGH.disabled = true;
                btnTestarGH.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Testando...';

                try {
                    const res = await fetch(`https://api.github.com/repos/${repo}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    });

                    if (res.ok) {
                        const dados = await res.json();
                        const podePush = dados.permissions ? dados.permissions.push : true;
                        if (podePush) {
                            mostrarStatusGH(`✓ Conectado com sucesso ao repositório "${dados.full_name}" com permissão de escrita!`, true);
                        } else {
                            mostrarStatusGH(`Aviso: Conectado a "${dados.full_name}", mas seu token não tem permissão de escrita (push).`, false);
                        }
                    } else if (res.status === 401) {
                        mostrarStatusGH("Erro 401: Token inválido ou expirado. Verifique o token.", false);
                    } else if (res.status === 404) {
                        mostrarStatusGH(`Erro 404: Repositório "${repo}" não encontrado ou token sem acesso.`, false);
                    } else {
                        mostrarStatusGH(`Erro ${res.status}: Não foi possível autenticar.`, false);
                    }
                } catch (err) {
                    mostrarStatusGH(`Erro de conexão: ${err.message}`, false);
                } finally {
                    btnTestarGH.disabled = false;
                    btnTestarGH.innerHTML = '<i class="fa-solid fa-plug"></i> Testar Conexão';
                }
            });
        }

        function mostrarStatusGH(msg, sucesso) {
            if (!statusMsg) return;
            statusMsg.style.display = 'block';
            statusMsg.style.background = sucesso ? '#ecfdf5' : '#fef2f2';
            statusMsg.style.color = sucesso ? '#065f46' : '#991b1b';
            statusMsg.style.border = `1px solid ${sucesso ? '#a7f3d0' : '#fecaca'}`;
            statusMsg.textContent = msg;
        }

        // Botões Publicar no GitHub
        const dispararPublicacao = () => publicarNoGitHub(abrirModalGH);
        if (btnPublicarHero) btnPublicarHero.addEventListener('click', dispararPublicacao);
        if (btnPublicarFloating) btnPublicarFloating.addEventListener('click', dispararPublicacao);
    }

    // Função Principal de Publicação no GitHub
    async function publicarNoGitHub(abrirModalConfig) {
        const token = localStorage.getItem(GH_TOKEN_KEY);
        const repo = localStorage.getItem(GH_REPO_KEY) || (configState.githubRepo || 'educacao-tech/matriculas_creche');
        const branch = localStorage.getItem(GH_BRANCH_KEY) || (configState.githubBranch || 'main');

        if (!token) {
            alert("Para publicar diretamente no GitHub, você precisa conectar o seu Token de Acesso do GitHub.\nVamos abrir a tela de conexão.");
            abrirModalConfig();
            return;
        }

        const botoes = [
            document.getElementById('btn-publicar-github'),
            document.getElementById('btn-floating-github')
        ].filter(Boolean);

        botoes.forEach(b => {
            b.disabled = true;
            b.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Publicando no GitHub...';
        });

        try {
            // Salva antes no navegador
            salvarConfiguracao(false);

            const filePath = 'config.js';
            const urlArquivo = `https://api.github.com/repos/${repo}/contents/${filePath}?ref=${branch}`;

            // 1. Obtém o SHA atual do arquivo no GitHub
            let currentSha = null;
            const resGet = await fetch(urlArquivo, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (resGet.ok) {
                const dataGet = await resGet.json();
                currentSha = dataGet.sha;
            } else if (resGet.status === 401) {
                throw new Error("Token do GitHub inválido ou sem permissão. Verifique nas configurações do GitHub.");
            } else if (resGet.status !== 404) {
                const erroData = await resGet.json().catch(() => ({}));
                throw new Error(erroData.message || `Erro ao consultar arquivo (${resGet.status})`);
            }

            // 2. Prepara o conteúdo em Base64 compatível com UTF-8
            const codigoJS = gerarCodigoConfigJS();
            const base64Conteudo = btoa(unescape(encodeURIComponent(codigoJS)));

            // 3. Executa o Commit (PUT)
            const payload = {
                message: `Atualização de atalhos e links via Painel Administrativo em ${new Date().toLocaleDateString('pt-BR')}`,
                content: base64Conteudo,
                branch: branch
            };
            if (currentSha) {
                payload.sha = currentSha;
            }

            const resPut = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!resPut.ok) {
                const erroPut = await resPut.json().catch(() => ({}));
                throw new Error(erroPut.message || `Erro ao comitar alterações (${resPut.status})`);
            }

            const resultadoCommit = await resPut.json();
            const commitUrl = resultadoCommit.commit ? resultadoCommit.commit.html_url : `https://github.com/${repo}`;

            mostrarToast("Publicado no GitHub com sucesso! O site atualizará em breve.");

            // Alerta amigável com link do commit
            setTimeout(() => {
                const querVer = confirm(
                    "✓ Sucesso! O arquivo config.js foi atualizado no GitHub!\n\n" +
                    "O GitHub Pages publicará a nova versão automaticamente em instantes.\n\n" +
                    "Deseja visualizar o commit no GitHub?"
                );
                if (querVer && commitUrl) {
                    window.open(commitUrl, '_blank');
                }
            }, 300);

        } catch (err) {
            console.error("Erro na publicação:", err);
            alert(`Falha ao publicar no GitHub:\n\n${err.message}\n\nVerifique se o seu token possui permissão de escrita no repositório.`);
        } finally {
            botoes.forEach(b => {
                b.disabled = false;
                b.innerHTML = '<i class="fa-brands fa-github"></i> Publicar no GitHub';
            });
        }
    }

    // Exibe notificação toast
    function mostrarToast(mensagem) {
        let toast = document.getElementById('toast-box');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast-box';
            toast.className = 'toast-box';
            document.body.appendChild(toast);
        }
        toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>${mensagem}</span>`;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3200);
    }

})();
