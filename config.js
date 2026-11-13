/**
 * Configuração Padrão do Painel de Matrículas
 * Secretaria Municipal de Educação de Batatais
 * Atualizado via Painel Administrativo em: 13/11/2026, 09:04:14
 */

window.PORTAL_CONFIG = {
    "anoLetivo": "2026",
    "tituloHero": "Painel de Matrículas e Vagas",
    "subtituloHero": "Acesso unificado para solicitação de vagas, consulta de listas de espera e acompanhamento das convocações das creches e escolas municipais.",
    "senhaAdmin": "educacao2026",
    "atalhos": [
        {
            "id": "btn-inscricao",
            "chave": "inscricao",
            "titulo": "Inscrição para Creches",
            "descricao": "Formulário eletrônico oficial para cadastramento e solicitação de nova vaga em creche municipal.",
            "url": "https://sites.google.com/educacao.batatais.sp.gov.br/seceduc/inscri%C3%A7%C3%A3o-para-creches",
            "badge": "0 a 3 anos",
            "icone": "fa-solid fa-file-pen",
            "tema": "creche",
            "textoBotao": "Acessar Formulário",
            "ativo": true,
            "destaque": true
        },
        {
            "id": "btn-lista-espera",
            "chave": "listaEspera",
            "titulo": "Lista de Espera 2026",
            "descricao": "Acompanhe a posição na fila de espera, ordem de classificação e data de protocolo da solicitação.",
            "url": "https://docs.google.com/spreadsheets/d/10djnC8tHFILdwhxP-WmDq1EE-YJHj7LT/edit?usp=sharing&ouid=116154735950320601146&rtpof=true&sd=true",
            "badge": "Fila Pública",
            "icone": "fa-solid fa-list-ol",
            "tema": "espera",
            "textoBotao": "Consultar Planilha",
            "ativo": true,
            "destaque": false
        },
        {
            "id": "btn-lista-atendidos",
            "chave": "listaAtendidos",
            "titulo": "Lista de Atendidos 2026",
            "descricao": "Relação das crianças contempladas com vagas e convocadas para a confirmação de matrícula na unidade.",
            "url": "https://docs.google.com/spreadsheets/d/1g6mB1OIiXSPdfW6JkJ8LYX5upBaUQrjt/edit?usp=sharing&ouid=116154735950320601146&rtpof=true&sd=true",
            "badge": "Chamadas",
            "icone": "fa-solid fa-child-reaching",
            "tema": "atendidos",
            "textoBotao": "Ver Convocados",
            "ativo": true,
            "destaque": false
        },
        {
            "id": "btn-criterios",
            "chave": "criterios",
            "titulo": "Critérios da Lista de Espera",
            "descricao": "Diretrizes oficiais, pontuação socioeconômica, prioridades legais e regras de desempate da fila.",
            "url": "https://drive.google.com/file/d/1FyH2JI88pDoOfy_vE8qzSgrIFtccxmGc/view",
            "badge": "Regulamento",
            "icone": "fa-solid fa-gavel",
            "tema": "criterios",
            "textoBotao": "Abrir Documento",
            "ativo": true,
            "destaque": false
        },
        {
            "id": "btn-ei-ef",
            "chave": "eiEf",
            "titulo": "Inscrição EI e EF",
            "descricao": "Inscrições e transferências para turmas da Pré-escola (Educação Infantil) e Ensino Fundamental (1º ao 9º ano).",
            "url": "https://sites.google.com/educacao.batatais.sp.gov.br/seceduc/inscri%C3%A7%C3%A3o-para-ei-e-ef",
            "badge": "Etapas I, II e Fundamental",
            "icone": "fa-solid fa-school",
            "tema": "eief",
            "textoBotao": "Acessar Inscrição",
            "ativo": true,
            "destaque": true
        }
    ],
    "githubRepo": "educacao-tech/matriculas_creche",
    "githubBranch": "main"
};
