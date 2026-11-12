/**
 * Painel Administrativo - Lógica
 * Secretaria Municipal de Educação de Batatais
 */

(function() {
    'use strict';

    const STORAGE_KEY = 'portal_matriculas_config';
    const SESSION_AUTH_KEY = 'portal_admin_auth';

    // Estado da configuração em memória
    let configState = null;

    // Inicialização
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        carregarConfiguracao();
        configurarAutenticacao();
        configurarEventosGlobais();
    }

    // Carrega do LocalStorage ou do config.js padrão
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
    }

    // Controle de acesso por senha
    function configurarAutenticacao() {
        const loginOverlay = document.getElementById('login-overlay');
        const loginForm = document.getElementById('login-form');
        const inputSenha = document.getElementById('input-senha');
        const loginErro = document.getElementById('login-erro');

        const autenticado = sessionStorage.getItem(SESSION_AUTH_KEY) === 'true';

        if (autenticado) {
            loginOverlay.style.display = 'none';
            renderizarPainel();
        } else {
            loginOverlay.style.display = 'flex';
            inputSenha.focus();
        }

        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const senhaCorreta = configState.senhaAdmin || "educacao2026";
            if (inputSenha.value.trim() === senhaCorreta) {
                sessionStorage.setItem(SESSION_AUTH_KEY, 'true');
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

        // Botão de Logout
        const btnLogout = document.getElementById('btn-logout');
        if (btnLogout) {
            btnLogout.addEventListener('click', function() {
                sessionStorage.removeItem(SESSION_AUTH_KEY);
                window.location.reload();
            });
        }
    }

    // Renderiza a lista de cards de atalhos
    function renderizarPainel() {
        const container = document.getElementById('manage-list');
        container.innerHTML = '';

        // Campos gerais
        const inputAno = document.getElementById('config-ano');
        const inputSenhaAdmin = document.getElementById('config-senha');
        if (inputAno) inputAno.value = configState.anoLetivo || '2026';
        if (inputSenhaAdmin) inputSenhaAdmin.value = configState.senhaAdmin || 'educacao2026';

        // Atualiza contador no topo
        const totalAtivos = (configState.atalhos || []).filter(a => a.ativo).length;
        const totalGeral = (configState.atalhos || []).length;
        document.getElementById('count-ativos').textContent = `${totalAtivos} de ${totalGeral} atalhos ativos`;

        configState.atalhos.forEach((item, index) => {
            const cardEl = criarElementoCard(item, index);
            container.appendChild(cardEl);
        });
    }

    // Cria o HTML de cada card com toggle switch e campos editáveis
    function criarElementoCard(item, index) {
        const card = document.createElement('div');
        card.className = `manage-card ${item.ativo ? '' : 'is-disabled'}`;
        card.id = `manage-card-${index}`;

        card.innerHTML = `
            <div class="manage-card-top">
                <div class="manage-card-identity">
                    <div class="manage-icon-avatar">
                        <i class="${item.icone || 'fa-solid fa-link'}" aria-hidden="true"></i>
                    </div>
                    <div>
                        <div class="manage-title-preview" id="preview-title-${index}">${item.titulo}</div>
                        <span class="manage-tag-preview" id="preview-badge-${index}">${item.badge || 'Atalho'}</span>
                    </div>
                </div>

                <!-- Interruptor Habilitar / Desabilitar -->
                <label class="switch-control" title="Clique para habilitar ou desabilitar este botão na página pública">
                    <span class="switch-label ${item.ativo ? 'status-active' : 'status-inactive'}" id="label-status-${index}">
                        ${item.ativo ? '<i class="fa-solid fa-circle-check"></i> Habilitado' : '<i class="fa-solid fa-circle-xmark"></i> Desabilitado'}
                    </span>
                    <input type="checkbox" class="switch-input" data-index="${index}" ${item.ativo ? 'checked' : ''}>
                    <span class="switch-slider"></span>
                </label>
            </div>

            <div class="manage-card-body">
                <div class="manage-grid-inputs">
                    <!-- URL do Atalho -->
                    <div class="form-group">
                        <label class="form-label" for="url-${index}">
                            <i class="fa-solid fa-link"></i> Link de Destino (URL)
                        </label>
                        <div class="url-input-wrapper">
                            <input type="url" id="url-${index}" class="form-input input-url" data-index="${index}" value="${item.url || ''}" placeholder="https://..." required>
                            <a href="${item.url || '#'}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm btn-test-url" id="test-link-${index}" title="Abrir link em nova aba para testar">
                                <i class="fa-solid fa-arrow-up-right-from-square"></i> Testar
                            </a>
                        </div>
                        <span class="form-help">Pode ser planilha Google, formulário Google Sites, arquivo PDF do Drive, etc.</span>
                    </div>

                    <!-- Etiqueta / Badge -->
                    <div class="form-group">
                        <label class="form-label" for="badge-${index}">
                            <i class="fa-solid fa-tag"></i> Etiqueta / Categoria
                        </label>
                        <input type="text" id="badge-${index}" class="form-input input-badge" data-index="${index}" value="${item.badge || ''}" placeholder="Ex: 0 a 3 anos, Regulamento">
                    </div>
                </div>

                <div class="manage-grid-inputs" style="margin-top: 1rem;">
                    <!-- Título -->
                    <div class="form-group">
                        <label class="form-label" for="title-${index}">
                            <i class="fa-solid fa-heading"></i> Título do Botão
                        </label>
                        <input type="text" id="title-${index}" class="form-input input-title" data-index="${index}" value="${item.titulo || ''}" required>
                    </div>

                    <!-- Texto do Botão de Ação -->
                    <div class="form-group">
                        <label class="form-label" for="btntext-${index}">
                            <i class="fa-solid fa-hand-pointer"></i> Texto da Ação
                        </label>
                        <input type="text" id="btntext-${index}" class="form-input input-btntext" data-index="${index}" value="${item.textoBotao || 'Acessar'}">
                    </div>
                </div>

                <!-- Descrição -->
                <div class="form-group" style="margin-top: 1rem;">
                    <label class="form-label" for="desc-${index}">
                        <i class="fa-solid fa-align-left"></i> Descrição Explicativa
                    </label>
                    <input type="text" id="desc-${index}" class="form-input input-desc" data-index="${index}" value="${item.descricao || ''}" placeholder="Explique brevemente para os pais o que encontrarão ao clicar...">
                </div>
            </div>
        `;

        // Eventos do Switch
        const switchInput = card.querySelector('.switch-input');
        switchInput.addEventListener('change', function() {
            const idx = parseInt(this.getAttribute('data-index'), 10);
            const ativo = this.checked;
            configState.atalhos[idx].ativo = ativo;

            // Atualiza visual
            const labelStatus = document.getElementById(`label-status-${idx}`);
            if (ativo) {
                card.classList.remove('is-disabled');
                labelStatus.className = 'switch-label status-active';
                labelStatus.innerHTML = '<i class="fa-solid fa-circle-check"></i> Habilitado';
            } else {
                card.classList.add('is-disabled');
                labelStatus.className = 'switch-label status-inactive';
                labelStatus.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Desabilitado';
            }

            atualizarContadorTopo();
            salvarAutomatico();
        });

        // Evento da URL
        const inputUrl = card.querySelector('.input-url');
        const testLink = card.querySelector('.btn-test-url');
        inputUrl.addEventListener('input', function() {
            const idx = parseInt(this.getAttribute('data-index'), 10);
            configState.atalhos[idx].url = this.value;
            testLink.href = this.value || '#';
            salvarAutomatico();
        });

        // Evento do Título
        const inputTitle = card.querySelector('.input-title');
        inputTitle.addEventListener('input', function() {
            const idx = parseInt(this.getAttribute('data-index'), 10);
            configState.atalhos[idx].titulo = this.value;
            const previewTitle = document.getElementById(`preview-title-${idx}`);
            if (previewTitle) previewTitle.textContent = this.value || 'Sem título';
            salvarAutomatico();
        });

        // Evento da Badge
        const inputBadge = card.querySelector('.input-badge');
        inputBadge.addEventListener('input', function() {
            const idx = parseInt(this.getAttribute('data-index'), 10);
            configState.atalhos[idx].badge = this.value;
            const previewBadge = document.getElementById(`preview-badge-${idx}`);
            if (previewBadge) previewBadge.textContent = this.value || 'Geral';
            salvarAutomatico();
        });

        // Evento do Texto do Botão
        const inputBtnText = card.querySelector('.input-btntext');
        inputBtnText.addEventListener('input', function() {
            const idx = parseInt(this.getAttribute('data-index'), 10);
            configState.atalhos[idx].textoBotao = this.value;
            salvarAutomatico();
        });

        // Evento da Descrição
        const inputDesc = card.querySelector('.input-desc');
        inputDesc.addEventListener('input', function() {
            const idx = parseInt(this.getAttribute('data-index'), 10);
            configState.atalhos[idx].descricao = this.value;
            salvarAutomatico();
        });

        return card;
    }

    function atualizarContadorTopo() {
        const totalAtivos = (configState.atalhos || []).filter(a => a.ativo).length;
        const totalGeral = (configState.atalhos || []).length;
        const el = document.getElementById('count-ativos');
        if (el) el.textContent = `${totalAtivos} de ${totalGeral} atalhos ativos`;
    }

    // Salva no LocalStorage
    let timeoutSalvar = null;
    function salvarAutomatico() {
        clearTimeout(timeoutSalvar);
        timeoutSalvar = setTimeout(() => {
            salvarConfiguracao(false);
        }, 300);
    }

    function salvarConfiguracao(notificar = true) {
        // Atualiza campos gerais
        const inputAno = document.getElementById('config-ano');
        const inputSenhaAdmin = document.getElementById('config-senha');
        if (inputAno) configState.anoLetivo = inputAno.value.trim();
        if (inputSenhaAdmin && inputSenhaAdmin.value.trim()) {
            configState.senhaAdmin = inputSenhaAdmin.value.trim();
        }

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(configState));
            if (notificar) {
                mostrarToast("Alterações salvas com sucesso no navegador!");
            }
        } catch (e) {
            console.error("Erro ao salvar:", e);
            if (notificar) alert("Erro ao salvar configurações no navegador.");
        }
    }

    // Configura botões da barra superior e inferior
    function configurarEventosGlobais() {
        // Salvar Manualmente
        const btnSalvar = document.getElementById('btn-salvar');
        if (btnSalvar) {
            btnSalvar.addEventListener('click', () => salvarConfiguracao(true));
        }

        // Exportar / Ver Código config.js
        const btnExportar = document.getElementById('btn-exportar');
        const modalExportar = document.getElementById('modal-exportar');
        const modalClose = document.getElementById('modal-close');
        const modalCode = document.getElementById('modal-code');
        const btnCopiar = document.getElementById('btn-copiar-codigo');
        const btnBaixar = document.getElementById('btn-baixar-arquivo');

        if (btnExportar) {
            btnExportar.addEventListener('click', function() {
                salvarConfiguracao(false);
                const codigoJS = gerarCodigoConfigJS();
                modalCode.value = codigoJS;
                modalExportar.classList.add('active');
            });
        }

        if (modalClose) {
            modalClose.addEventListener('click', function() {
                modalExportar.classList.remove('active');
            });
        }

        // Fecha modal ao clicar fora
        window.addEventListener('click', function(e) {
            if (e.target === modalExportar) {
                modalExportar.classList.remove('active');
            }
        });

        // Copiar código
        if (btnCopiar) {
            btnCopiar.addEventListener('click', function() {
                modalCode.select();
                navigator.clipboard.writeText(modalCode.value).then(() => {
                    mostrarToast("Código copiado para a área de transferência!");
                }).catch(() => {
                    document.execCommand('copy');
                    mostrarToast("Código copiado!");
                });
            });
        }

        // Baixar arquivo config.js
        if (btnBaixar) {
            btnBaixar.addEventListener('click', function() {
                const codigoJS = gerarCodigoConfigJS();
                const blob = new Blob([codigoJS], { type: 'application/javascript;charset=utf-8' });
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

        // Restaurar Padrões
        const btnRestaurar = document.getElementById('btn-restaurar');
        if (btnRestaurar) {
            btnRestaurar.addEventListener('click', function() {
                if (confirm("Deseja realmente restaurar as configurações padrão originais? Quaisquer alterações não exportadas serão descartadas.")) {
                    localStorage.removeItem(STORAGE_KEY);
                    carregarConfiguracao();
                    renderizarPainel();
                    mostrarToast("Configurações originais restauradas!");
                }
            });
        }
    }

    // Gera a representação em JavaScript do config.js
    function gerarCodigoConfigJS() {
        const jsonBonito = JSON.stringify(configState, null, 4);
        return `/**
 * Configuração do Painel de Matrículas
 * Secretaria Municipal de Educação de Batatais
 * Atualizado via Painel Administrativo em: ${new Date().toLocaleString('pt-BR')}
 */

window.PORTAL_CONFIG = ${jsonBonito};
`;
    }

    // Exibe toast temporário
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
