/**
 * PDI - Plano de Desenvolvimento Individual
 * Esboço para demonstração - edusense
 */

// ========== STATE ==========
let currentActionIsSaved = false;
let actionModalContext = null;
let currentAcaoBlocoId = null;
let currentAcaoValor = '';
let currentAcaoComportamento = '';
let currentDetalhesPdiId = null;
let currentDetalhesIsSupervisorView = false;

const STATUS_LABELS = {
  rascunho: { text: 'Rascunho', class: 'bg-amber-500/20 text-amber-400 border border-amber-500/40' },
  em_andamento: { text: 'Em andamento', class: 'bg-primary/20 text-primary border border-primary/40' },
  concluido: { text: 'Concluído', class: 'bg-green-500/20 text-green-400 border border-green-500/40' }
};

// Normaliza PDI para estrutura com blocos (valor, comportamento, acoes por bloco)
function normalizarBlocosPDI(dados) {
  if (dados.blocos && Array.isArray(dados.blocos) && dados.blocos.length > 0) return dados.blocos;
  return [{ valor: dados.valor || '', comportamento: dados.comportamento || '', acoes: dados.acoes || [] }];
}

// Retorna array de ações do PDI (de acoes ou de blocos) para cálculo de progresso
function getAcoesPDI(dados) {
  if (dados.acoes && Array.isArray(dados.acoes) && dados.acoes.length > 0) return dados.acoes;
  const blocos = normalizarBlocosPDI(dados);
  return blocos.flatMap(b => b.acoes || []);
}

// Calcula progresso baseado no status das ações (concluído = 100%, demais = 0)
function calcularProgressoPDI(dados) {
  const acoes = getAcoesPDI(dados);
  if (acoes.length === 0) return 0;
  const concluidas = acoes.filter(a => a.status === 'concluido').length;
  return Math.round((concluidas / acoes.length) * 100);
}

// Store de dados dos PDIs (objetivo, tipo, valor, comportamento, acoes, status, blocos, etc.)
const STORAGE_KEY_VALORES = 'pdi_valores_data';
const STORAGE_KEY_PDI = 'pdi_store';
const pdiStoreDefault = {
  'pdi-1': {
    objetivo: 'Assumir cargo de Coordenação de Marketing',
    tipoLabel: 'Próximo cargo',
    valor: 'Liderança',
    comportamento: 'Comunicar-se de forma clara e objetiva',
    status: 'em_andamento',
    criadoPorSupervisor: false,
    colaboradorId: 'julia',
    contextoInicial: 'Carla, você precisa melhorar a comunicação interna e a liderança da equipe. Vamos focar em desenvolver essas competências para que você possa assumir um cargo de coordenação no próximo ano.',
    comentarios: [],
    acoes: [
      { texto: 'Conduzir reuniões semanais com a equipe, com foco em ser mais clara e objetiva na comunicação.', metodologia: '70 – Experiência Prática', dataInicio: '01/06/2024', dataFim: '30/08/2024', status: 'em_andamento' },
      { texto: 'Participar de mentoria Renata Souza', metodologia: '20 – Aprendizado Social', dataInicio: '06/05/2024', dataFim: '31/07/2024', status: 'nao_iniciado' },
      { texto: 'Iniciar o curso "Comunicação Clara e Eficaz" da biblioteca na plataforma.', metodologia: '20 – Aprendizado Social', dataInicio: '10/06/2024', dataFim: '10/07/2024', status: 'nao_iniciado' }
    ]
  },
  'pdi-2': {
    objetivo: 'Aprimorar habilidades em desenvolvimento front-end',
    tipoLabel: 'Desenvolvimento transversal',
    valor: 'Gestão de Projetos',
    comportamento: 'Planejar e executar projetos',
    status: 'rascunho',
    criadoPorSupervisor: true,
    colaboradorId: 'roberto',
    contextoInicial: '',
    comentarios: [],
    acoes: []
  },
  'pdi-3': {
    objetivo: 'Concluir certificação PMP',
    tipoLabel: 'Próximo cargo',
    valor: 'Gestão de Projetos',
    comportamento: 'Gerenciar stakeholders',
    status: 'concluido',
    criadoPorSupervisor: false,
    colaboradorId: 'isis',
    contextoInicial: '',
    comentarios: [],
    acoes: [
      { texto: 'Completar curso preparatório PMP', metodologia: '10 – Aprendizado Formal', dataInicio: '01/01/2024', dataFim: '30/04/2024', status: 'concluido' }
    ]
  }
};
function carregarPDIDoStorage() {
  try {
    const s = localStorage.getItem(STORAGE_KEY_PDI);
    if (s) {
      const parsed = JSON.parse(s);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (_) {}
  return JSON.parse(JSON.stringify(pdiStoreDefault));
}
function salvarPDINoStorage() {
  try {
    localStorage.setItem(STORAGE_KEY_PDI, JSON.stringify(pdiStore));
  } catch (_) {}
}
let pdiStore = carregarPDIDoStorage();

// Estrutura: Valor > Comportamentos (cada um com nome + acoes)
const VALORES_DATA_DEFAULT = {
  Liderança: [
    { nome: 'Comunicar-se de forma clara e objetiva', acoes: ['Conduzir reuniões semanais com a equipe', 'Participar de mentoria', 'Iniciar o curso "Comunicação Clara e Eficaz"'] },
    { nome: 'Conduzir reuniões com foco em resultados', acoes: ['Liderar um projeto multidisciplinar', 'Assumir responsabilidade por uma entrega crítica'] },
    { nome: 'Delegar tarefas efetivamente', acoes: ['Fazer shadowing de um líder', 'Participar de grupos de estudo'] }
  ],
  Comunicação: [
    { nome: 'Escuta ativa', acoes: ['Iniciar curso da biblioteca', 'Completar certificação'] },
    { nome: 'Apresentações em público', acoes: ['Ler livro técnico'] }
  ],
  'Gestão de Projetos': [
    { nome: 'Planejar e executar projetos', acoes: ['Liderar um projeto multidisciplinar', 'Conduzir reuniões semanais'] },
    { nome: 'Gerenciar stakeholders', acoes: ['Completar certificação PMP'] }
  ]
};
function carregarValoresDoStorage() {
  try {
    const s = localStorage.getItem(STORAGE_KEY_VALORES);
    if (s) {
      const parsed = JSON.parse(s);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (_) {}
  return JSON.parse(JSON.stringify(VALORES_DATA_DEFAULT));
}
let VALORES_DATA = carregarValoresDoStorage();
function salvarValoresNoStorage() {
  try {
    localStorage.setItem(STORAGE_KEY_VALORES, JSON.stringify(VALORES_DATA));
  } catch (_) {}
}
// Helper: retorna lista de nomes de comportamentos (para selects)
function getComportamentosList(valor) {
  const arr = VALORES_DATA[valor];
  if (!arr) return [];
  return arr.map(c => typeof c === 'string' ? c : c.nome);
}
// Helper: retorna ações de um comportamento
function getAcoesDoComportamento(valor, comportamento) {
  const arr = VALORES_DATA[valor];
  if (!arr) return [];
  const comp = arr.find(c => (typeof c === 'string' ? c : c.nome) === comportamento);
  return comp?.acoes || [];
}
const ACOES_SUGERIDAS = {
  '70': ['Liderar um projeto multidisciplinar', 'Conduzir reuniões semanais com a equipe', 'Assumir responsabilidade por uma entrega crítica'],
  '20': ['Participar de mentoria', 'Fazer shadowing de um líder', 'Participar de grupos de estudo'],
  '10': ['Iniciar curso da biblioteca', 'Completar certificação', 'Ler livro técnico']
};
const COLABORADOR_LABELS = { julia: 'Julia Duarte', roberto: 'Roberto Carlos', isis: 'Isis Azevedo' };
const COLABORADOR_CARGOS = { julia: 'Analista de Marketing', roberto: 'Desenvolvedor', isis: 'Gerente de Projetos' };
const SUPERVISOR_NOME = 'Vinicius Pacheco';
const SUPERVISOR_CARGO = 'Supervisor';

function atualizarStatusCardsSupervisor() {
  document.querySelectorAll('#supervisor-time-lista [data-pdi-id]').forEach(card => {
    const pdiId = card.dataset.pdiId;
    const dados = pdiStore[pdiId];
    if (!dados) return;
    const s = STATUS_LABELS[dados.status] || STATUS_LABELS.rascunho;
    const statusSpan = card.querySelector('.supervisor-card-status');
    if (statusSpan) {
      statusSpan.textContent = s.text;
      statusSpan.className = `supervisor-card-status px-2 py-0.5 rounded text-xs font-medium border ${s.class}`;
    }
    const titulo = card.querySelector('.flex.items-center.gap-2 .font-medium');
    if (titulo) titulo.textContent = dados.objetivo || 'PDI sem objetivo';
    const textos = card.querySelectorAll('.flex.items-start.gap-4 .text-sm.text-gray-400');
    const nomeAluno = card.querySelector('.text-sm.text-primary.font-medium.mt-1');
    const alunoNome = COLABORADOR_LABELS[dados.colaboradorId] || dados.colaboradorId || '—';
    if (nomeAluno) nomeAluno.textContent = alunoNome;
    if (textos.length >= 2) {
      textos[0].textContent = `Tipo: ${dados.tipoLabel || '—'}`;
      textos[1].textContent = `Valor: ${dados.valor || '—'} • Comportamento: ${dados.comportamento || '—'}`;
    }
    const progresso = calcularProgressoPDI(dados);
    const barClass = dados.status === 'concluido' ? 'bg-green-500' : dados.status === 'em_andamento' ? 'bg-primary' : 'bg-gray-500';
    const progressClass = dados.status === 'concluido' ? 'text-green-400' : dados.status === 'em_andamento' ? 'text-primary' : 'text-gray-400';
    const barra = card.querySelector('.supervisor-card-barra');
    const progressSpan = card.querySelector('.supervisor-card-progress');
    if (barra) {
      barra.style.width = progresso + '%';
      barra.className = `h-full ${barClass} rounded-full supervisor-card-barra`;
    }
    if (progressSpan) {
      progressSpan.textContent = progresso + (dados.status === 'concluido' ? '%' : '%');
      progressSpan.className = `supervisor-card-progress text-sm ${progressClass} font-medium`;
    }
  });
}

function renderizarRascunhosSupervisor() {
  const lista = document.getElementById('supervisor-rascunhos-lista');
  const wrapper = document.getElementById('supervisor-rascunhos-wrapper');
  if (!lista || !wrapper) return;
  const rascunhos = Object.entries(pdiStore).filter(([, d]) => d.status === 'rascunho' && d.criadoPorSupervisor);
  lista.innerHTML = '';
  rascunhos.forEach(([id, d]) => {
    const progresso = calcularProgressoPDI(d);
    const card = criarCardRascunhoSupervisor({ ...d, id, progresso });
    lista.appendChild(card);
  });
  wrapper.classList.toggle('hidden', rascunhos.length === 0);
}

// ========== VIEW SWITCHING ==========
document.querySelectorAll('.view-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const view = tab.dataset.view;
    
    // Update tabs
    document.querySelectorAll('.view-tab').forEach(t => {
      t.classList.remove('tab-active', 'text-primary');
      t.classList.add('text-gray-400');
    });
    tab.classList.add('tab-active', 'text-primary');
    tab.classList.remove('text-gray-400');
    
    // Update content
    document.querySelectorAll('.view-content').forEach(content => content.classList.add('hidden'));
    document.getElementById(`view-${view}`).classList.remove('hidden');

    if (view === 'supervisor') {
      atualizarStatusCardsSupervisor();
      renderizarRascunhosSupervisor();
    }
    if (view === 'admin') {
      renderizarAdminValores();
    }
    const headerNome = document.getElementById('header-usuario-nome');
    const headerAvatar = document.getElementById('header-usuario-avatar');
    if (headerNome) headerNome.textContent = view === 'supervisor' ? `Olá, ${SUPERVISOR_NOME}` : 'Olá, Julia Duarte';
    if (headerAvatar) headerAvatar.textContent = (view === 'supervisor' ? SUPERVISOR_NOME : 'Julia Duarte').charAt(0);
  });
});

// Inicialização: renderizar listas de PDIs a partir do storage
function renderizarListaPDIAluno() {
  const lista = document.getElementById('pdi-lista-aluno');
  if (!lista) return;
  lista.innerHTML = '';
  Object.entries(pdiStore).forEach(([id, dados]) => {
    const progresso = calcularProgressoPDI(dados);
    const card = criarCardPDI({ ...dados, id, status: dados.status || 'rascunho', progresso });
    lista.appendChild(card);
  });
}
function renderizarListaPDISupervisor() {
  const lista = document.getElementById('supervisor-time-lista');
  if (!lista) return;
  lista.innerHTML = '';
  Object.entries(pdiStore).forEach(([id, dados]) => {
    const progresso = calcularProgressoPDI(dados);
    const s = STATUS_LABELS[dados.status] || STATUS_LABELS.rascunho;
    const barClass = dados.status === 'concluido' ? 'bg-green-500' : dados.status === 'em_andamento' ? 'bg-primary' : 'bg-gray-500';
    const progressClass = dados.status === 'concluido' ? 'text-green-400' : dados.status === 'em_andamento' ? 'text-primary' : 'text-gray-400';
    const alunoNome = COLABORADOR_LABELS[dados.colaboradorId] || dados.colaboradorId || '—';
    const div = document.createElement('div');
    div.dataset.pdiId = id;
    div.className = 'bg-dark-card rounded-lg p-6 border border-gray-700 flex items-start justify-between gap-4';
    div.innerHTML = `
      <div class="flex items-start gap-4">
        <img src="https://api.dicebear.com/7.x/avataaars/png?seed=person&size=96" alt="Avatar" class="w-12 h-12 rounded-full object-cover shrink-0">
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <p class="font-medium">${(dados.objetivo || 'PDI sem objetivo').replace(/</g, '&lt;')}</p>
            <span class="supervisor-card-status px-2 py-0.5 rounded text-xs font-medium border ${s.class}">${s.text}</span>
          </div>
          <p class="text-sm text-primary font-medium mt-1">${alunoNome}</p>
          <p class="text-sm text-gray-400 mt-1">Tipo: ${dados.tipoLabel || '—'}</p>
          <p class="text-sm text-gray-400">Valor: ${(dados.valor || '—')} • Comportamento: ${(dados.comportamento || '—').replace(/</g, '&lt;')}</p>
          <div class="mt-3 flex items-center gap-4">
            <div class="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden max-w-xs">
              <div class="h-full ${barClass} rounded-full supervisor-card-barra" style="width: ${progresso}%"></div>
            </div>
            <span class="supervisor-card-progress text-sm ${progressClass} font-medium">${progresso}%</span>
          </div>
        </div>
      </div>
      <button class="px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg text-white text-sm font-medium flex items-center gap-2 shrink-0">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        Ver detalhes
      </button>
    `;
    lista.appendChild(div);
  });
  atualizarStatusCardsSupervisor();
}
renderizarListaPDIAluno();
renderizarListaPDISupervisor();

// Delegação de clique para botões "Ver detalhes" na visão do supervisor (usa data-pdi-id do card)
document.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn || !btn.textContent?.trim().toLowerCase().includes('detalhes')) return;
  const card = btn.closest('[data-pdi-id]');
  if (!card?.dataset?.pdiId) return;
  if (!document.getElementById('supervisor-time-lista')?.contains(card) && !document.getElementById('supervisor-rascunhos-lista')?.contains(card)) return;
  e.preventDefault();
  e.stopPropagation();
  openDetalhesPDIModalSupervisor(card.dataset.pdiId);
}, true);

// ========== MODAL: AÇÃO ==========
function openActionModal(isSaved, valor, comportamento) {
  currentActionIsSaved = isSaved;
  actionModalContext = null;
  document.getElementById('modal-acao-titulo').textContent = `Nova Ação do PDI – ${valor || 'Liderança'}`;
  
  const metodologia = document.getElementById('acao-metodologia');
  const tipo = document.getElementById('acao-tipo');
  const outroContainer = document.getElementById('acao-outro-container');
  const dataInicio = document.getElementById('acao-data-inicio');
  const dataFim = document.getElementById('acao-data-fim');
  const status = document.getElementById('acao-status');
  
  metodologia.value = '70';
  tipo.value = '';
  outroContainer.classList.add('hidden');
  dataInicio.value = '';
  dataFim.value = '';
  status.value = 'nao_iniciado';
  updateAcaoTipoOptions('70');
  
  if (isSaved) {
    [metodologia, tipo, dataInicio, dataFim].forEach(f => { f.disabled = true; f.classList.add('opacity-60', 'cursor-not-allowed'); });
    document.getElementById('acao-outro')?.classList.add('opacity-60', 'cursor-not-allowed');
    status.disabled = false;
    document.querySelector('#modal-acao button[onclick="saveAction()"]').classList.add('hidden');
  } else {
    [metodologia, tipo, dataInicio, dataFim].forEach(f => { f.disabled = false; f.classList.remove('opacity-60', 'cursor-not-allowed'); });
    document.getElementById('acao-outro')?.classList.remove('opacity-60', 'cursor-not-allowed');
    document.querySelector('#modal-acao button[onclick="saveAction()"]').classList.remove('hidden');
  }
  
  document.getElementById('modal-acao').classList.remove('hidden');
  document.getElementById('modal-acao').classList.add('flex');
}

function abrirModalAcaoParaNovoPDI(blocoId) {
  if (!blocoId) return;
  actionModalContext = 'novo_pdi';
  currentAcaoBlocoId = blocoId;
  
  const bloco = document.getElementById(blocoId);
  const valorSelect = bloco?.querySelector('select[data-valor]');
  const comportamentoSelect = bloco?.querySelector('.comportamento-select');
  const valor = valorSelect?.value || 'Liderança';
  const comportamento = comportamentoSelect?.options[comportamentoSelect.selectedIndex]?.text || '';
  currentAcaoValor = valor;
  currentAcaoComportamento = comportamento;
  
  document.getElementById('modal-acao-titulo').textContent = `Nova Ação do PDI – ${valor}`;
  
  const metodologia = document.getElementById('acao-metodologia');
  const tipo = document.getElementById('acao-tipo');
  const outroContainer = document.getElementById('acao-outro-container');
  metodologia.value = '70';
  tipo.value = '';
  document.getElementById('acao-data-inicio').value = '';
  document.getElementById('acao-data-fim').value = '';
  document.getElementById('acao-status').value = 'nao_iniciado';
  outroContainer.classList.add('hidden');
  updateAcaoTipoOptions('70', valor, comportamento);
  
  document.querySelector('#modal-acao button[onclick="saveAction()"]').classList.remove('hidden');
  document.getElementById('modal-acao').classList.remove('hidden');
  document.getElementById('modal-acao').classList.add('flex');
}

function updateAcaoTipoOptions(metodologia, valor, comportamento) {
  const tipo = document.getElementById('acao-tipo');
  let opts = [];
  if (valor && comportamento) {
    opts = getAcoesDoComportamento(valor, comportamento);
  }
  if (opts.length === 0) {
    opts = ACOES_SUGERIDAS[metodologia] || ACOES_SUGERIDAS['70'];
  }
  tipo.innerHTML = '<option value="">Selecione uma ação sugerida...</option>' +
    opts.map((t, i) => `<option value="${i}">${t}</option>`).join('') +
    '<option value="outro">Outro (ação personalizada)</option>';
}

function closeActionModal() {
  document.getElementById('modal-acao').classList.add('hidden');
  document.getElementById('modal-acao').classList.remove('flex');
  actionModalContext = null;
  currentAcaoBlocoId = null;
  currentAcaoValor = '';
  currentAcaoComportamento = '';
}

function saveAction() {
  const metodologia = document.getElementById('acao-metodologia');
  const tipo = document.getElementById('acao-tipo');
  const outro = document.getElementById('acao-outro');
  const dataInicio = document.getElementById('acao-data-inicio').value;
  const dataFim = document.getElementById('acao-data-fim').value;
  const status = document.getElementById('acao-status').value;
  let acaoTexto = tipo.value === 'outro' ? (outro?.value?.trim() || '') : (tipo.options[tipo.selectedIndex]?.text || '');
  if (!acaoTexto || acaoTexto === 'Outro (ação personalizada)') { closeActionModal(); return; }
  const metodologiaLabels = { '70': '70 – Experiência Prática', '20': '20 – Aprendizado Social', '10': '10 – Aprendizado Formal' };
  const statusLabels = { nao_iniciado: 'Não Iniciado', em_andamento: 'Em Andamento', concluido: 'Concluído' };
  const acaoHtml = (excluirOnclick) => `
    <div class="flex items-center justify-between p-3 bg-dark-bg rounded-lg border border-gray-700 bloco-acao-item">
      <div>
        <p class="text-sm font-medium">${acaoTexto.replace(/</g, '&lt;')}</p>
        <p class="text-xs text-gray-400">${metodologiaLabels[metodologia.value]} • ${dataInicio || '—'} a ${dataFim || '—'}</p>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs px-2 py-0.5 rounded bg-gray-700">${statusLabels[status]}</span>
        <button onclick="${excluirOnclick}" class="text-red-400 hover:text-red-300 text-sm">Excluir</button>
      </div>
    </div>
  `;

  if ((actionModalContext === 'novo_pdi' || actionModalContext === 'novo_pdi_supervisor') && currentAcaoBlocoId) {
    const bloco = document.getElementById(currentAcaoBlocoId);
    const acoesLista = bloco?.querySelector('.bloco-acoes-lista');
    if (acoesLista) {
      const div = document.createElement('div');
      div.innerHTML = acaoHtml("this.closest('.flex').remove()");
      acoesLista.appendChild(div.firstElementChild);
    }
  } else if (actionModalContext === 'detalhes_pdi' && currentAcaoBlocoId) {
    const bloco = document.getElementById(currentAcaoBlocoId);
    const acoesLista = bloco?.querySelector('.bloco-acoes-lista');
    if (acoesLista) {
      const div = document.createElement('div');
      div.innerHTML = acaoHtml("this.closest('.bloco-acao-item').remove()");
      acoesLista.appendChild(div.firstElementChild);
    }
  }
  closeActionModal();
}

document.getElementById('acao-metodologia')?.addEventListener('change', (e) => updateAcaoTipoOptions(e.target.value, currentAcaoValor, currentAcaoComportamento));
document.getElementById('acao-tipo')?.addEventListener('change', (e) => {
  document.getElementById('acao-outro-container').classList.toggle('hidden', e.target.value !== 'outro');
});
document.getElementById('modal-acao')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeActionModal();
});

// ========== MODAL: DETALHES DO PDI ==========
function openDetalhesPDIModalSupervisor(pdiId) {
  const dados = pdiStore[pdiId] || {};
  const podeModificar = dados.criadoPorSupervisor === true;
  openDetalhesPDIModal(dados.status || 'em_andamento', pdiId, { isSupervisorView: true, podeModificar });
}

function openDetalhesPDIModal(status, pdiId, opts) {
  VALORES_DATA = carregarValoresDoStorage();
  const isSupervisorView = opts?.isSupervisorView === true;
  const podeModificar = opts?.podeModificar !== false;
  currentDetalhesPdiId = pdiId || null;
  currentDetalhesIsSupervisorView = isSupervisorView;
  const dados = pdiStore[pdiId] || {};
  const statusAtual = status || dados.status || 'em_andamento';
  const s = STATUS_LABELS[statusAtual];

  // Supervisor só pode modificar PDIs que criou
  const isRascunho = statusAtual === 'rascunho' && (!isSupervisorView || podeModificar);
  const podeEditarStatusAcoes = !isSupervisorView || podeModificar;

  const statusEl = document.getElementById('pdi-modal-status');
  if (statusEl && s) {
    statusEl.textContent = s.text;
    statusEl.className = `px-2 py-0.5 rounded text-xs font-medium border ${s.class}`;
  }

  const blocos = normalizarBlocosPDI(dados);
  const acoesFlat = blocos.flatMap(b => b.acoes || []);

  const objetivoEl = document.getElementById('pdi-modal-objetivo');
  const tipoEl = document.getElementById('pdi-modal-tipo');
  const valorEl = document.getElementById('pdi-modal-valor');
  const comportamentoEl = document.getElementById('pdi-modal-comportamento');
  if (objetivoEl) {
    objetivoEl.value = dados.objetivo || '';
    objetivoEl.readOnly = !isRascunho;
  }
  if (tipoEl) {
    tipoEl.value = dados.tipoLabel || '';
    tipoEl.readOnly = !isRascunho;
  }
  if (valorEl) valorEl.value = blocos[0]?.valor || dados.valor || '';
  if (comportamentoEl) comportamentoEl.value = blocos[0]?.comportamento || dados.comportamento || '';

  // Alternar entre modo blocos (rascunho) e modo leitura (em andamento/concluído)
  const blocosWrapper = document.getElementById('pdi-modal-blocos-wrapper');
  const valorCompWrapper = document.getElementById('pdi-modal-valor-comportamento-wrapper');
  const acoesWrapper = document.getElementById('pdi-modal-acoes-wrapper');
  if (blocosWrapper) blocosWrapper.classList.toggle('hidden', !isRascunho);
  if (valorCompWrapper) valorCompWrapper.classList.toggle('hidden', isRascunho);
  if (acoesWrapper) acoesWrapper.classList.toggle('hidden', isRascunho);

  // Em rascunho: renderizar blocos editáveis
  if (isRascunho) {
    renderizarBlocosDetalhesPDI(blocos);
  }

  // Perfil: aluno (nome + cargo) e supervisor (nome + cargo)
  const colaboradorId = dados.colaboradorId || 'julia';
  const alunoNome = COLABORADOR_LABELS[colaboradorId] || colaboradorId;
  const alunoCargo = COLABORADOR_CARGOS[colaboradorId] || '—';
  const perfilAlunoNome = document.getElementById('pdi-modal-aluno-nome');
  const perfilAlunoCargo = document.getElementById('pdi-modal-aluno-cargo');
  const perfilAlunoAvatar = document.getElementById('pdi-modal-aluno-avatar');
  const perfilSupervisor = document.getElementById('pdi-modal-supervisor-info');
  if (perfilAlunoNome) perfilAlunoNome.textContent = alunoNome;
  if (perfilAlunoCargo) perfilAlunoCargo.textContent = alunoCargo;
  if (perfilAlunoAvatar) perfilAlunoAvatar.textContent = (alunoNome || '?').charAt(0);
  if (perfilSupervisor) perfilSupervisor.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg> ${SUPERVISOR_NOME} • ${SUPERVISOR_CARGO}`;

  // Contexto Inicial (autor: supervisor)
  const contextoEl = document.getElementById('pdi-modal-contexto');
  const contextoWrapper = document.getElementById('pdi-modal-contexto-wrapper');
  const contextoAutor = document.getElementById('pdi-modal-contexto-autor');
  if (contextoEl) contextoEl.textContent = dados.contextoInicial || '';
  if (contextoWrapper) contextoWrapper.style.display = dados.contextoInicial ? '' : 'none';
  if (contextoAutor) contextoAutor.textContent = SUPERVISOR_NOME;

  const comentarioAutorLabel = document.getElementById('pdi-comentario-autor-label');
  if (comentarioAutorLabel) comentarioAutorLabel.textContent = isSupervisorView ? SUPERVISOR_NOME : alunoNome;

  // Ações (modo leitura) - status editável só se podeEditarStatusAcoes
  const acoesContainer = document.getElementById('pdi-modal-acoes');
  const btnSalvarStatus = document.getElementById('pdi-modal-salvar-status-btn');
  const statusLabelsAcao = { nao_iniciado: 'Não Iniciado', em_andamento: 'Em Andamento', concluido: 'Concluído' };
  if (acoesContainer && !isRascunho) {
    acoesContainer.innerHTML = acoesFlat.length ? acoesFlat.map((a, i) => {
      const statusTxt = statusLabelsAcao[a.status] || 'Não Iniciado';
      const statusSelect = podeEditarStatusAcoes ? `
        <select class="acao-status-select bg-dark-card border border-gray-600 rounded px-2 py-1 text-xs focus:outline-none focus:border-primary" data-action-index="${i}">
          <option value="nao_iniciado" ${a.status === 'nao_iniciado' ? 'selected' : ''}>Não Iniciado</option>
          <option value="em_andamento" ${a.status === 'em_andamento' ? 'selected' : ''}>Em Andamento</option>
          <option value="concluido" ${a.status === 'concluido' ? 'selected' : ''}>Concluído</option>
        </select>
      ` : `<span class="text-xs px-2 py-0.5 rounded bg-gray-700">${statusTxt}</span>`;
      return `
      <div class="flex items-center justify-between gap-4 flex-wrap p-3 bg-dark-bg rounded-lg border border-gray-700" data-action-index="${i}">
        <div>
          <p class="text-sm font-medium">${(a.texto || '').replace(/</g, '&lt;')}</p>
          <p class="text-xs text-gray-400">${a.metodologia || ''} • ${a.dataInicio || '—'} a ${a.dataFim || '—'}</p>
        </div>
        ${statusSelect}
      </div>
    `;
    }).join('') : '<p class="text-sm text-gray-400">Nenhuma ação cadastrada.</p>';
    if (btnSalvarStatus) btnSalvarStatus.classList.toggle('hidden', acoesFlat.length === 0 || !podeEditarStatusAcoes);
  }

  // Mostrar/ocultar botões (Excluir, Salvar Rascunho e Enviar só para rascunho e quando pode modificar)
  const btnExcluir = document.getElementById('btn-excluir-pdi');
  const btnEnviar = document.getElementById('btn-enviar-supervisor-detalhes');
  const btnRascunho = document.getElementById('btn-salvar-rascunho-detalhes');
  const mostrarBtnsRascunho = statusAtual === 'rascunho' && isRascunho;
  if (btnExcluir) btnExcluir.style.display = mostrarBtnsRascunho ? '' : 'none';
  if (btnEnviar) btnEnviar.style.display = mostrarBtnsRascunho ? '' : 'none';
  if (btnRascunho) btnRascunho.style.display = mostrarBtnsRascunho ? '' : 'none';

  // Comentários - limpar e preencher apenas se houver comentários no PDI
  const comentariosLista = document.getElementById('pdi-comentarios-lista');
  if (comentariosLista) {
    comentariosLista.innerHTML = '';
    (dados.comentarios || []).forEach(c => {
      const div = document.createElement('div');
      div.className = 'flex items-start gap-3 p-3 bg-dark-bg/50 rounded-lg border border-gray-700';
      div.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold shrink-0">${(c.autor || 'U').charAt(0)}</div>
        <div class="flex-1">
          <p class="text-sm font-medium">${(c.autor || '').replace(/</g, '&lt;')}</p>
          <p class="text-xs text-gray-400 mb-1">${c.data || ''}</p>
          <p class="text-sm text-gray-300">${(c.texto || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
        </div>
      `;
      comentariosLista.appendChild(div);
    });
  }

  document.getElementById('modal-detalhes-pdi').classList.remove('hidden');
  document.getElementById('modal-detalhes-pdi').classList.add('flex');
}

function closeDetalhesPDIModal() {
  document.getElementById('modal-detalhes-pdi').classList.add('hidden');
  document.getElementById('modal-detalhes-pdi').classList.remove('flex');
}

function renderizarBlocosDetalhesPDI(blocos) {
  const lista = document.getElementById('pdi-modal-blocos-lista');
  if (!lista) return;
  const valorOpts = Object.keys(VALORES_DATA).map(v => `<option value="${v}">${v}</option>`).join('');
  lista.innerHTML = (blocos || []).map((bloco, bi) => {
    const id = 'pdi-detalhes-vc-' + bi + '-' + Date.now();
    const comportamentos = getComportamentosList(bloco.valor) || getComportamentosList('Liderança') || [];
    const compOpts = comportamentos.map(c => `<option ${c === bloco.comportamento ? 'selected' : ''}>${c}</option>`).join('');
    const acoes = bloco.acoes || [];
    const statusLabels = { nao_iniciado: 'Não Iniciado', em_andamento: 'Em Andamento', concluido: 'Concluído' };
    const acoesHtml = acoes.map((a, ai) => `
      <div class="flex items-center justify-between p-3 bg-dark-bg rounded-lg border border-gray-700 bloco-acao-item">
        <div>
          <p class="text-sm font-medium">${(a.texto || '').replace(/</g, '&lt;')}</p>
          <p class="text-xs text-gray-400">${a.metodologia || ''} • ${a.dataInicio || '—'} a ${a.dataFim || '—'}</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs px-2 py-0.5 rounded bg-gray-700">${statusLabels[a.status] || 'Não Iniciado'}</span>
          <button onclick="this.closest('.bloco-acao-item').remove()" class="text-red-400 hover:text-red-300 text-sm">Excluir</button>
        </div>
      </div>
    `).join('');
    return `
      <div id="${id}" class="p-4 bg-dark-bg/50 rounded-lg border border-gray-700 bloco-detalhes-pdi" data-bloco-index="${bi}">
        <div class="grid grid-cols-2 gap-4 mb-3">
          <div>
            <label class="block text-primary text-xs font-medium mb-1">Valor (Competência)</label>
            <select data-valor onchange="atualizarComportamentosDetalhes(this)" class="w-full bg-dark-bg border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">${valorOpts}</select>
          </div>
          <div>
            <label class="block text-primary text-xs font-medium mb-1">Comportamento</label>
            <select class="comportamento-select w-full bg-dark-bg border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">${compOpts}</select>
          </div>
        </div>
        <div class="mt-3 pt-3 border-t border-gray-700">
          <p class="text-xs text-gray-400 mb-2">Ações vinculadas a este valor e comportamento:</p>
          <div class="bloco-acoes-lista space-y-2 mb-2">${acoesHtml}</div>
          <button onclick="abrirModalAcaoParaDetalhesPDI('${id}')" class="px-3 py-1.5 bg-primary/20 text-primary hover:bg-primary/30 rounded text-xs font-medium flex items-center gap-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Adicionar Ação
          </button>
        </div>
        <button onclick="removerBlocoDetalhesPDI('${id}')" class="mt-2 text-red-400 hover:text-red-300 text-xs">Remover bloco</button>
      </div>
    `;
  }).join('');
  // Ajustar selects de valor para valor correto
  lista.querySelectorAll('.bloco-detalhes-pdi').forEach((div, bi) => {
    const bloco = blocos[bi];
    if (bloco) {
      const valorSel = div.querySelector('select[data-valor]');
      if (valorSel) valorSel.value = bloco.valor || '';
    }
  });
}

function atualizarComportamentosDetalhes(selectValor) {
  const valor = selectValor.value;
  const compSel = selectValor.closest('.grid').querySelector('.comportamento-select');
  if (!compSel) return;
  const comportamentos = getComportamentosList(valor) || [];
  compSel.innerHTML = comportamentos.map(c => `<option>${c}</option>`).join('');
}

function adicionarBlocoDetalhesPDI() {
  const lista = document.getElementById('pdi-modal-blocos-lista');
  if (!lista) return;
  const blocosAtuais = obterBlocosDoModalDetalhes();
  blocosAtuais.push({ valor: 'Liderança', comportamento: getComportamentosList('Liderança')[0] || '', acoes: [] });
  renderizarBlocosDetalhesPDI(blocosAtuais);
}

function obterBlocosDoModalDetalhes() {
  const lista = document.getElementById('pdi-modal-blocos-lista');
  if (!lista) return [];
  const blocos = [];
  lista.querySelectorAll('.bloco-detalhes-pdi').forEach(div => {
    const valorSel = div.querySelector('select[data-valor]');
    const compSel = div.querySelector('.comportamento-select');
    const acoesDivs = div.querySelectorAll('.bloco-acao-item');
    const acoes = [];
    acoesDivs.forEach(ac => {
      const textoEl = ac.querySelector('p.text-sm.font-medium');
      const metaEl = ac.querySelector('p.text-xs');
      const statusSpan = ac.querySelector('span.rounded');
      const meta = metaEl?.textContent || '';
      const parts = meta.split('•').map(s => s.trim());
      const metodologia = parts[0] || '';
      const datasPart = parts[1] || '';
      const [dataInicio, dataFim] = (datasPart || '').split(' a ').map(s => s?.trim() || '—');
      const statusTxt = (statusSpan?.textContent || '').toLowerCase();
      const status = statusTxt.includes('andamento') ? 'em_andamento' : statusTxt.includes('conclu') ? 'concluido' : 'nao_iniciado';
      acoes.push({ texto: textoEl?.textContent?.trim() || '', metodologia, dataInicio: dataInicio || '—', dataFim: dataFim || '—', status });
    });
    blocos.push({
      valor: valorSel?.value || '',
      comportamento: compSel?.options[compSel.selectedIndex]?.text || '',
      acoes
    });
  });
  return blocos;
}

function removerBlocoDetalhesPDI(blocoId) {
  document.getElementById(blocoId)?.remove();
}

function abrirModalAcaoParaDetalhesPDI(blocoId) {
  if (!blocoId || !currentDetalhesPdiId) return;
  actionModalContext = 'detalhes_pdi';
  currentAcaoBlocoId = blocoId;

  const bloco = document.getElementById(blocoId);
  const valorSelect = bloco?.querySelector('select[data-valor]');
  const comportamentoSelect = bloco?.querySelector('.comportamento-select');
  const valor = valorSelect?.value || 'Liderança';
  const comportamento = comportamentoSelect?.options[comportamentoSelect.selectedIndex]?.text || '';
  currentAcaoValor = valor;
  currentAcaoComportamento = comportamento;

  document.getElementById('modal-acao-titulo').textContent = `Nova Ação do PDI – ${valor}`;
  const metodologia = document.getElementById('acao-metodologia');
  const tipo = document.getElementById('acao-tipo');
  metodologia.value = '70';
  tipo.value = '';
  document.getElementById('acao-data-inicio').value = '';
  document.getElementById('acao-data-fim').value = '';
  document.getElementById('acao-status').value = 'nao_iniciado';
  document.getElementById('acao-outro-container')?.classList.add('hidden');
  updateAcaoTipoOptions('70', valor, comportamento);
  document.querySelector('#modal-acao button[onclick="saveAction()"]')?.classList.remove('hidden');
  document.getElementById('modal-acao').classList.remove('hidden');
  document.getElementById('modal-acao').classList.add('flex');
}

function salvarStatusAcoesPDI() {
  const pdiId = currentDetalhesPdiId;
  if (!pdiId || !pdiStore[pdiId]) return;

  const acoes = pdiStore[pdiId].acoes || [];
  const selects = document.querySelectorAll('#pdi-modal-acoes .acao-status-select');
  let alterado = false;

  selects.forEach((sel, i) => {
    const novoStatus = sel.value;
    if (acoes[i] && acoes[i].status !== novoStatus) {
      acoes[i].status = novoStatus;
      alterado = true;
    }
  });

  salvarPDINoStorage();

  // Recalcular progresso e verificar se todas ações concluídas -> marcar PDI como Concluído
  const total = acoes.length;
  const concluidas = acoes.filter(a => a.status === 'concluido').length;
  const progresso = total > 0 ? Math.round((concluidas / total) * 100) : 0;

  if (total > 0 && concluidas === total) {
    pdiStore[pdiId].status = 'concluido';
    salvarPDINoStorage();
  }

  // Re-renderizar listas para refletir progresso e status
  renderizarListaPDIAluno();
  renderizarListaPDISupervisor();
  atualizarStatusCardsSupervisor();

  closeDetalhesPDIModal();
}

function adicionarComentarioPDI() {
  const input = document.getElementById('pdi-comentario-input');
  const texto = input?.value?.trim();
  if (!texto || !currentDetalhesPdiId) return;

  const dados = pdiStore[currentDetalhesPdiId];
  if (!dados) return;
  const autor = currentDetalhesIsSupervisorView ? SUPERVISOR_NOME : (COLABORADOR_LABELS[dados.colaboradorId] || dados.colaboradorId || '—');
  const inicial = (autor || 'U').charAt(0);

  const lista = document.getElementById('pdi-comentarios-lista');
  const agora = new Date();
  const hora = agora.getHours().toString().padStart(2, '0') + ':' + agora.getMinutes().toString().padStart(2, '0');
  const dataStr = `Hoje às ${hora}`;

  if (!dados.comentarios) dados.comentarios = [];
  dados.comentarios.push({ autor, data: dataStr, texto });
  salvarPDINoStorage();

  const div = document.createElement('div');
  div.className = 'flex items-start gap-3 p-3 bg-dark-bg/50 rounded-lg border border-gray-700';
  div.innerHTML = `
    <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold shrink-0">${inicial}</div>
    <div class="flex-1">
      <p class="text-sm font-medium">${(autor || '').replace(/</g, '&lt;')}</p>
      <p class="text-xs text-gray-400 mb-1">${dataStr}</p>
      <p class="text-sm text-gray-300">${texto.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
    </div>
  `;
  lista.appendChild(div);
  input.value = '';
}

document.getElementById('modal-detalhes-pdi')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeDetalhesPDIModal();
});

// Event listeners para botões do modal Detalhes do PDI
document.getElementById('btn-excluir-pdi')?.addEventListener('click', excluirPDI);
document.getElementById('btn-salvar-rascunho-detalhes')?.addEventListener('click', salvarDetalhesPDIRascunho);
document.getElementById('btn-enviar-supervisor-detalhes')?.addEventListener('click', enviarDetalhesPDISupervisor);

// ========== MODAL: NOVO PDI (Aluno) ==========
function openNovoPDIModal() {
  VALORES_DATA = carregarValoresDoStorage();
  document.getElementById('novo-pdi-objetivo').value = '';
  document.getElementById('novo-pdi-tipo').value = '';
  document.getElementById('novo-pdi-valores-lista').innerHTML = '';
  document.getElementById('modal-novo-pdi').classList.remove('hidden');
  document.getElementById('modal-novo-pdi').classList.add('flex');
}

function closeNovoPDIModal() {
  document.getElementById('modal-novo-pdi').classList.add('hidden');
  document.getElementById('modal-novo-pdi').classList.remove('flex');
}

function adicionarValorComportamento() {
  const lista = document.getElementById('novo-pdi-valores-lista');
  const id = 'vc-' + Date.now();
  const valorOpts = Object.keys(VALORES_DATA).map(v => `<option value="${v}">${v}</option>`).join('');
  const div = document.createElement('div');
  div.id = id;
  div.className = 'p-4 bg-dark-bg/50 rounded-lg border border-gray-700';
  div.innerHTML = `
    <div class="grid grid-cols-2 gap-4 mb-3">
      <div>
        <label class="block text-primary text-xs font-medium mb-1">Valor (Competência)</label>
        <select data-valor onchange="atualizarComportamentos(this)" class="w-full bg-dark-bg border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
          ${valorOpts}
        </select>
      </div>
      <div>
        <label class="block text-primary text-xs font-medium mb-1">Comportamento</label>
        <select class="w-full bg-dark-bg border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary comportamento-select">
          ${getComportamentosList('Liderança').map(c => `<option>${c}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="mt-3 pt-3 border-t border-gray-700">
      <p class="text-xs text-gray-400 mb-2">Ações vinculadas a este valor e comportamento:</p>
      <div class="bloco-acoes-lista space-y-2 mb-2"></div>
      <button onclick="abrirModalAcaoParaNovoPDI('${id}')" class="px-3 py-1.5 bg-primary/20 text-primary hover:bg-primary/30 rounded text-xs font-medium flex items-center gap-1">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Adicionar Ação
      </button>
    </div>
    <button onclick="this.closest('[id^=vc-]').remove()" class="mt-2 text-red-400 hover:text-red-300 text-xs">Remover bloco</button>
  `;
  lista.appendChild(div);
}

function atualizarComportamentos(selectValor) {
  const valor = selectValor.value;
  const blocos = selectValor.closest('.grid').querySelector('.comportamento-select');
  if (!blocos) return;
  const comportamentos = getComportamentosList(valor) || [];
  blocos.innerHTML = comportamentos.map(c => `<option>${c}</option>`).join('');
}

const TIPO_LABELS = {
  performance: 'Performance atual',
  proximo_cargo: 'Próximo cargo',
  transversal: 'Desenvolvimento transversal'
};

function criarCardPDI(dados) {
  const id = dados.id || 'pdi-' + Date.now();
  const status = dados.status || 'rascunho';
  const progresso = dados.progresso ?? 0;
  const s = STATUS_LABELS[status];
  const barClass = status === 'concluido' ? 'bg-green-500' : status === 'em_andamento' ? 'bg-primary' : 'bg-gray-500';
  const progressClass = status === 'concluido' ? 'text-green-400' : status === 'em_andamento' ? 'text-primary' : 'text-gray-400';
  const avatarUrl = 'https://api.dicebear.com/7.x/avataaars/png?seed=person&size=96';

  const div = document.createElement('div');
  div.dataset.pdiId = id;
  div.className = 'bg-dark-card rounded-lg p-6 border border-gray-700 flex items-start justify-between gap-4';
  div.innerHTML = `
    <div class="flex items-start gap-4">
      <img src="${avatarUrl}" alt="Avatar" class="w-12 h-12 rounded-full object-cover shrink-0">
      <div>
        <div class="flex items-center gap-2 flex-wrap">
          <p class="font-medium">${(dados.objetivo || 'PDI sem objetivo').replace(/</g, '&lt;')}</p>
          <span class="px-2 py-0.5 rounded text-xs font-medium border ${s.class}">${s.text}</span>
        </div>
        <p class="text-sm text-gray-400 mt-1">Tipo: ${dados.tipoLabel || '—'}</p>
        <p class="text-sm text-gray-400">Valor: ${(dados.valor || '—')} • Comportamento: ${(dados.comportamento || '—').replace(/</g, '&lt;')}</p>
        <div class="mt-3 flex items-center gap-4">
          <div class="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden max-w-xs">
            <div class="h-full ${barClass} rounded-full" style="width: ${progresso}%"></div>
          </div>
          <span class="text-sm ${progressClass} font-medium">${progresso}%</span>
        </div>
      </div>
    </div>
    <button onclick="openDetalhesPDIModal('${status}', '${id}')" class="px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg text-white text-sm font-medium flex items-center gap-2 shrink-0">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
      Ver detalhes
    </button>
  `;
  return div;
}

function obterDadosFormNovoPDI() {
  const objetivo = document.getElementById('novo-pdi-objetivo')?.value?.trim() || '';
  const tipoValue = document.getElementById('novo-pdi-tipo')?.value || '';
  const tipoLabel = TIPO_LABELS[tipoValue] || '—';
  const listaValores = document.getElementById('novo-pdi-valores-lista');
  const primeiroBloco = listaValores?.querySelector('[id^="vc-"]');
  const valorSelect = primeiroBloco?.querySelector('select[data-valor]');
  const comportamentoSelect = primeiroBloco?.querySelector('.comportamento-select');
  const valor = valorSelect?.value || '';
  const comportamento = comportamentoSelect?.options[comportamentoSelect?.selectedIndex]?.text || '';
  const acoes = [];
  (listaValores?.querySelectorAll('.bloco-acoes-lista > div') || []).forEach(div => {
    const textoEl = div.querySelector('p.text-sm');
    const metaEl = div.querySelector('p.text-xs');
    const statusSpan = div.querySelector('span.rounded');
    const meta = metaEl?.textContent || '';
    const parts = meta.split('•').map(s => s.trim());
    const metodologia = parts[0] || '';
    const datasPart = parts[1] || '';
    const [dataInicio, dataFim] = datasPart.split(' a ').map(s => s?.trim() || '—');
    const statusTxt = (statusSpan?.textContent || '').toLowerCase();
    const status = statusTxt.includes('andamento') ? 'em_andamento' : statusTxt.includes('conclu') ? 'concluido' : 'nao_iniciado';
    acoes.push({
      texto: textoEl?.textContent?.trim() || '',
      metodologia,
      dataInicio: dataInicio || '—',
      dataFim: dataFim || '—',
      status
    });
  });
  const qtdConcluidas = acoes.filter(a => a.status === 'concluido').length;
  const progresso = acoes.length > 0 ? Math.round((qtdConcluidas / acoes.length) * 100) : 0;
  return { objetivo, tipoValue, tipoLabel, valor, comportamento, acoes, progresso };
}

function salvarNovoPDIRascunho() {
  const dados = obterDadosFormNovoPDI();
  if (!dados.objetivo) { alert('Preencha o objetivo do PDI.'); return; }
  const id = 'pdi-' + Date.now();
  pdiStore[id] = {
    objetivo: dados.objetivo,
    tipoLabel: dados.tipoLabel,
    valor: dados.valor,
    comportamento: dados.comportamento,
    status: 'rascunho',
    contextoInicial: '',
    comentarios: [],
    acoes: dados.acoes || []
  };
  salvarPDINoStorage();
  const card = criarCardPDI({
    ...dados,
    id,
    status: 'rascunho',
    progresso: dados.progresso
  });
  document.getElementById('pdi-lista-aluno').insertBefore(card, document.getElementById('pdi-lista-aluno').firstChild);
  closeNovoPDIModal();
}

function enviarNovoPDIAluno() {
  const dados = obterDadosFormNovoPDI();
  if (!dados.objetivo) { alert('Preencha o objetivo do PDI.'); return; }
  const id = 'pdi-' + Date.now();
  pdiStore[id] = {
    objetivo: dados.objetivo,
    tipoLabel: dados.tipoLabel,
    valor: dados.valor,
    comportamento: dados.comportamento,
    status: 'em_andamento',
    contextoInicial: '',
    comentarios: [],
    acoes: dados.acoes || []
  };
  salvarPDINoStorage();
  const card = criarCardPDI({
    ...dados,
    id,
    status: 'em_andamento',
    progresso: dados.progresso
  });
  document.getElementById('pdi-lista-aluno').insertBefore(card, document.getElementById('pdi-lista-aluno').firstChild);
  closeNovoPDIModal();
}

function excluirPDI() {
  const pdiId = currentDetalhesPdiId;
  if (!pdiId || !pdiStore[pdiId]) { closeDetalhesPDIModal(); return; }
  const dados = pdiStore[pdiId];
  if (dados.status !== 'rascunho') return;
  if (!confirm('Tem certeza que deseja excluir este PDI? Esta ação não pode ser desfeita.')) return;
  delete pdiStore[pdiId];
  salvarPDINoStorage();
  document.querySelectorAll(`[data-pdi-id="${pdiId}"]`).forEach(el => el.remove());
  const wrapperRascunhos = document.getElementById('supervisor-rascunhos-wrapper');
  const listaRascunhos = document.getElementById('supervisor-rascunhos-lista');
  if (wrapperRascunhos && listaRascunhos && listaRascunhos.children.length === 0) wrapperRascunhos.classList.add('hidden');
  renderizarListaPDIAluno();
  renderizarListaPDISupervisor();
  renderizarRascunhosSupervisor();
  closeDetalhesPDIModal();
}

function salvarDetalhesPDIRascunho() {
  const pdiId = currentDetalhesPdiId;
  if (!pdiId || !pdiStore[pdiId]) { closeDetalhesPDIModal(); return; }

  const objetivo = document.getElementById('pdi-modal-objetivo')?.value?.trim() || '';
  const tipoLabel = document.getElementById('pdi-modal-tipo')?.value?.trim() || '';
  const blocos = obterBlocosDoModalDetalhes();
  const acoesFlat = blocos.flatMap(b => b.acoes || []);

  // Persistir blocos e manter valor/comportamento do primeiro para compatibilidade
  pdiStore[pdiId].blocos = blocos;
  pdiStore[pdiId].objetivo = objetivo;
  pdiStore[pdiId].tipoLabel = tipoLabel;
  pdiStore[pdiId].valor = blocos[0]?.valor || '';
  pdiStore[pdiId].comportamento = blocos[0]?.comportamento || '';
  pdiStore[pdiId].acoes = acoesFlat;

  const concluidas = acoesFlat.filter(a => a.status === 'concluido').length;
  const progresso = acoesFlat.length > 0 ? Math.round((concluidas / acoesFlat.length) * 100) : 0;

  if (acoesFlat.length > 0 && concluidas === acoesFlat.length) {
    pdiStore[pdiId].status = 'concluido';
  }
  salvarPDINoStorage();

  document.querySelectorAll(`[data-pdi-id="${pdiId}"]`).forEach(card => {
    const titulo = card.querySelector('.flex.items-center.gap-2 p.font-medium');
    if (titulo) titulo.textContent = objetivo || 'PDI sem objetivo';
    const textos = card.querySelectorAll('.flex.items-start.gap-4 .text-sm.text-gray-400');
    if (textos.length >= 2) {
      const valor = blocos[0]?.valor || '';
      const comportamento = blocos[0]?.comportamento || '';
      textos[0].textContent = `Tipo: ${tipoLabel || '—'}`;
      textos[1].textContent = blocos.length > 1
        ? `Valores: ${blocos.map(b => b.valor).filter(Boolean).join(', ') || '—'} • Comportamentos: ${blocos.map(b => b.comportamento).filter(Boolean).join(', ') || '—'}`
        : `Valor: ${valor || '—'} • Comportamento: ${comportamento || '—'}`;
    }
    const barra = card.querySelector('.overflow-hidden .h-full.rounded-full');
    const progressSpan = card.querySelector('.mt-3.flex.items-center.gap-4 span') || card.querySelector('.flex.items-center.gap-2.mb-2 span');
    if (barra) barra.style.width = progresso + '%';
    if (progressSpan) progressSpan.textContent = progresso + '%';
  });

  if (pdiStore[pdiId].status === 'concluido') {
    renderizarListaPDIAluno();
    renderizarListaPDISupervisor();
    renderizarRascunhosSupervisor();
  }

  closeDetalhesPDIModal();
}

function enviarDetalhesPDISupervisor() {
  if (!currentDetalhesPdiId) { closeDetalhesPDIModal(); return; }
  const card = document.querySelector(`[data-pdi-id="${currentDetalhesPdiId}"]`);
  if (!card) { closeDetalhesPDIModal(); return; }
  if (pdiStore[currentDetalhesPdiId]) {
    pdiStore[currentDetalhesPdiId].status = 'em_andamento';
    salvarPDINoStorage();
  }
  const tituloFlex = card.querySelector('.flex.items-center.gap-2');
  const badge = tituloFlex?.querySelector('span:last-child');
  if (badge) {
    badge.textContent = 'Em andamento';
    badge.className = 'px-2 py-0.5 rounded text-xs font-medium bg-primary/20 text-primary border border-primary/40';
  }
  const barra = card.querySelector('.overflow-hidden .rounded-full');
  if (barra) barra.className = 'h-full bg-primary rounded-full';
  const progressSpans = card.querySelectorAll('.text-sm.font-medium');
  progressSpans.forEach(s => {
    if (s.textContent.includes('%')) s.className = 'text-sm text-primary font-medium';
  });
  const btn = card.querySelector('button[onclick^="openDetalhesPDIModal"]');
  if (btn) btn.setAttribute('onclick', `openDetalhesPDIModal('em_andamento', '${currentDetalhesPdiId}')`);
  document.getElementById('pdi-modal-status').textContent = 'Em andamento';
  document.getElementById('pdi-modal-status').className = 'px-2 py-0.5 rounded text-xs font-medium bg-primary/20 text-primary border border-primary/40';
  const cardRascunho = document.querySelector(`#supervisor-rascunhos-lista [data-pdi-id="${currentDetalhesPdiId}"]`);
  if (cardRascunho) cardRascunho.remove();
  const listaRascunhos = document.getElementById('supervisor-rascunhos-lista');
  const wrapperRascunhos = document.getElementById('supervisor-rascunhos-wrapper');
  if (wrapperRascunhos && listaRascunhos && listaRascunhos.children.length === 0) wrapperRascunhos.classList.add('hidden');
  renderizarListaPDISupervisor();
  closeDetalhesPDIModal();
}

document.getElementById('modal-novo-pdi')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeNovoPDIModal();
});

// Event listeners para botões do modal Novo PDI (aluno)
document.getElementById('btn-novo-pdi-cancelar')?.addEventListener('click', closeNovoPDIModal);
document.getElementById('btn-novo-pdi-salvar-rascunho')?.addEventListener('click', salvarNovoPDIRascunho);
document.getElementById('btn-novo-pdi-enviar')?.addEventListener('click', enviarNovoPDIAluno);

// ========== MODAL: NOVO PDI SUPERVISOR ==========
function openNovoPDISupervisorModal() {
  VALORES_DATA = carregarValoresDoStorage();
  document.getElementById('novo-pdi-supervisor-colaborador').value = '';
  document.getElementById('novo-pdi-supervisor-contexto').value = '';
  document.getElementById('novo-pdi-supervisor-objetivo').value = '';
  document.getElementById('novo-pdi-supervisor-tipo').value = '';
  document.getElementById('novo-pdi-supervisor-valores-lista').innerHTML = '';
  adicionarValorComportamentoSupervisor();
  document.getElementById('modal-novo-pdi-supervisor').classList.remove('hidden');
  document.getElementById('modal-novo-pdi-supervisor').classList.add('flex');
}

function closeNovoPDISupervisorModal() {
  document.getElementById('modal-novo-pdi-supervisor').classList.add('hidden');
  document.getElementById('modal-novo-pdi-supervisor').classList.remove('flex');
}

function adicionarValorComportamentoSupervisor() {
  const lista = document.getElementById('novo-pdi-supervisor-valores-lista');
  const id = 'vc-sup-' + Date.now();
  const valorOpts = Object.keys(VALORES_DATA).map(v => `<option value="${v}">${v}</option>`).join('');
  const div = document.createElement('div');
  div.id = id;
  div.className = 'p-4 bg-dark-bg/50 rounded-lg border border-gray-700';
  div.innerHTML = `
    <div class="grid grid-cols-2 gap-4 mb-3">
      <div>
        <label class="block text-primary text-xs font-medium mb-1">Valor (Competência)</label>
        <select data-valor onchange="atualizarComportamentosSupervisor(this)" class="w-full bg-dark-bg border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">${valorOpts}</select>
      </div>
      <div>
        <label class="block text-primary text-xs font-medium mb-1">Comportamento</label>
        <select class="w-full bg-dark-bg border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary comportamento-select">${getComportamentosList('Liderança').map(c => `<option>${c}</option>`).join('')}</select>
      </div>
    </div>
    <div class="mt-3 pt-3 border-t border-gray-700">
      <p class="text-xs text-gray-400 mb-2">Ações vinculadas a este valor e comportamento:</p>
      <div class="bloco-acoes-lista space-y-2 mb-2"></div>
      <button onclick="abrirModalAcaoParaNovoPDISupervisor('${id}')" class="px-3 py-1.5 bg-primary/20 text-primary hover:bg-primary/30 rounded text-xs font-medium flex items-center gap-1">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Adicionar Ação
      </button>
    </div>
    <button onclick="this.closest('[id^=vc-sup-]').remove()" class="mt-2 text-red-400 hover:text-red-300 text-xs">Remover bloco</button>
  `;
  lista.appendChild(div);
}

function atualizarComportamentosSupervisor(selectValor) {
  const valor = selectValor.value;
  const compSel = selectValor.closest('.grid').querySelector('.comportamento-select');
  if (!compSel) return;
  const comportamentos = getComportamentosList(valor) || [];
  compSel.innerHTML = comportamentos.map(c => `<option>${c}</option>`).join('');
}

function abrirModalAcaoParaNovoPDISupervisor(blocoId) {
  if (!blocoId) return;
  actionModalContext = 'novo_pdi_supervisor';
  currentAcaoBlocoId = blocoId;
  const bloco = document.getElementById(blocoId);
  const valorSelect = bloco?.querySelector('select[data-valor]');
  const comportamentoSelect = bloco?.querySelector('.comportamento-select');
  const valor = valorSelect?.value || 'Liderança';
  const comportamento = comportamentoSelect?.options[comportamentoSelect.selectedIndex]?.text || '';
  currentAcaoValor = valor;
  currentAcaoComportamento = comportamento;
  document.getElementById('modal-acao-titulo').textContent = `Nova Ação do PDI – ${valor}`;
  const metodologia = document.getElementById('acao-metodologia');
  const tipo = document.getElementById('acao-tipo');
  metodologia.value = '70';
  tipo.value = '';
  document.getElementById('acao-data-inicio').value = '';
  document.getElementById('acao-data-fim').value = '';
  document.getElementById('acao-status').value = 'nao_iniciado';
  document.getElementById('acao-outro-container')?.classList.add('hidden');
  updateAcaoTipoOptions('70', valor, comportamento);
  document.querySelector('#modal-acao button[onclick="saveAction()"]')?.classList.remove('hidden');
  document.getElementById('modal-acao').classList.remove('hidden');
  document.getElementById('modal-acao').classList.add('flex');
}

function obterDadosFormNovoPDISupervisor() {
  const colaboradorId = document.getElementById('novo-pdi-supervisor-colaborador')?.value || '';
  const contextoInicial = document.getElementById('novo-pdi-supervisor-contexto')?.value?.trim() || '';
  const objetivo = document.getElementById('novo-pdi-supervisor-objetivo')?.value?.trim() || '';
  const tipoValue = document.getElementById('novo-pdi-supervisor-tipo')?.value || '';
  const tipoLabel = TIPO_LABELS[tipoValue] || '—';
  const primeiroBloco = document.querySelector('#novo-pdi-supervisor-valores-lista [data-valor]')?.closest('.p-4');
  const valorSelect = primeiroBloco?.querySelector('select[data-valor]');
  const comportamentoSelect = primeiroBloco?.querySelector('.comportamento-select');
  const valor = valorSelect?.value || '';
  const comportamento = comportamentoSelect?.options[comportamentoSelect?.selectedIndex]?.text || '';
  const acoes = [];
  document.querySelectorAll('#novo-pdi-supervisor-valores-lista .bloco-acoes-lista > div').forEach(div => {
    const textoEl = div.querySelector('p.text-sm');
    const metaEl = div.querySelector('p.text-xs');
    const statusSpan = div.querySelector('span.rounded');
    const meta = metaEl?.textContent || '';
    const parts = meta.split('•').map(s => s.trim());
    const metodologia = parts[0] || '';
    const datasPart = parts[1] || '';
    const [dataInicio, dataFim] = (datasPart || '').split(' a ').map(s => s?.trim() || '—');
    const statusTxt = (statusSpan?.textContent || '').toLowerCase();
    const status = statusTxt.includes('andamento') ? 'em_andamento' : statusTxt.includes('conclu') ? 'concluido' : 'nao_iniciado';
    acoes.push({ texto: textoEl?.textContent?.trim() || '', metodologia, dataInicio: dataInicio || '—', dataFim: dataFim || '—', status });
  });
  const blocos = [];
  document.querySelectorAll('#novo-pdi-supervisor-valores-lista .p-4').forEach(blocoDiv => {
    const vs = blocoDiv.querySelector('select[data-valor]');
    const cs = blocoDiv.querySelector('.comportamento-select');
    const acoesBloco = [];
    blocoDiv.querySelectorAll('.bloco-acoes-lista > div').forEach(div => {
      const textoEl = div.querySelector('p.text-sm');
      const metaEl = div.querySelector('p.text-xs');
      const statusSpan = div.querySelector('span.rounded');
      const meta = metaEl?.textContent || '';
      const parts = meta.split('•').map(s => s.trim());
      const statusTxt = (statusSpan?.textContent || '').toLowerCase();
      const status = statusTxt.includes('andamento') ? 'em_andamento' : statusTxt.includes('conclu') ? 'concluido' : 'nao_iniciado';
      acoesBloco.push({ texto: textoEl?.textContent?.trim() || '', metodologia: parts[0] || '', dataInicio: (parts[1] || '').split(' a ')[0]?.trim() || '—', dataFim: (parts[1] || '').split(' a ')[1]?.trim() || '—', status });
    });
    blocos.push({ valor: vs?.value || '', comportamento: cs?.options[cs?.selectedIndex]?.text || '', acoes: acoesBloco });
  });
  const acoesFlat = blocos.flatMap(b => b.acoes || []);
  const progresso = acoesFlat.length > 0 ? Math.round((acoesFlat.filter(a => a.status === 'concluido').length / acoesFlat.length) * 100) : 0;
  return { objetivo, tipoValue, tipoLabel, valor, comportamento, acoes: acoesFlat, blocos, progresso, colaboradorId, contextoInicial };
}

function criarCardRascunhoSupervisor(dados) {
  const id = dados.id || 'pdi-' + Date.now();
  const progresso = dados.progresso ?? 0;
  const colaboradorNome = COLABORADOR_LABELS[dados.colaboradorId] || dados.colaboradorId || 'Colaborador';
  const avatarUrl = 'https://api.dicebear.com/7.x/avataaars/png?seed=person&size=96';
  const div = document.createElement('div');
  div.dataset.pdiId = id;
  div.className = 'bg-dark-card rounded-lg p-6 border border-gray-700 flex items-start justify-between gap-4';
  div.innerHTML = `
    <div class="flex items-start gap-4">
      <img src="${avatarUrl}" alt="Avatar" class="w-12 h-12 rounded-full object-cover shrink-0">
      <div>
        <div class="flex items-center gap-2 flex-wrap">
          <p class="font-medium">${(dados.objetivo || 'PDI sem objetivo').replace(/</g, '&lt;')}</p>
          <span class="px-2 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/40">Rascunho</span>
        </div>
        <p class="text-sm text-primary font-medium mt-1">${colaboradorNome}</p>
        <p class="text-sm text-gray-400 mt-1">Tipo: ${dados.tipoLabel || '—'}</p>
        <p class="text-sm text-gray-400">Valor: ${(dados.valor || '—')} • Comportamento: ${(dados.comportamento || '—').replace(/</g, '&lt;')}</p>
        <div class="mt-3 flex items-center gap-4">
          <div class="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden max-w-xs">
            <div class="h-full bg-gray-500 rounded-full" style="width: ${progresso}%"></div>
          </div>
          <span class="text-sm text-gray-400 font-medium">${progresso}%</span>
        </div>
      </div>
    </div>
    <button class="px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg text-white text-sm font-medium flex items-center gap-2 shrink-0">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
      Ver detalhes
    </button>
  `;
  return div;
}

function salvarNovoPDISupervisorRascunho() {
  const dados = obterDadosFormNovoPDISupervisor();
  if (!dados.objetivo) { alert('Preencha o objetivo do PDI.'); return; }
  if (!dados.colaboradorId) { alert('Selecione o colaborador.'); return; }
  const id = 'pdi-' + Date.now();
  pdiStore[id] = {
    objetivo: dados.objetivo,
    tipoLabel: dados.tipoLabel,
    valor: dados.valor,
    comportamento: dados.comportamento,
    blocos: dados.blocos || [{ valor: dados.valor, comportamento: dados.comportamento, acoes: dados.acoes || [] }],
    status: 'rascunho',
    contextoInicial: dados.contextoInicial || '',
    criadoPorSupervisor: true,
    colaboradorId: dados.colaboradorId,
    comentarios: [],
    acoes: dados.acoes || []
  };
  salvarPDINoStorage();
  const card = criarCardPDI({ ...dados, id, status: 'rascunho', progresso: dados.progresso });
  document.getElementById('pdi-lista-aluno').insertBefore(card, document.getElementById('pdi-lista-aluno').firstChild);
  const cardSupervisor = criarCardRascunhoSupervisor({ ...dados, id, progresso: dados.progresso });
  const listaRascunhos = document.getElementById('supervisor-rascunhos-lista');
  const wrapperRascunhos = document.getElementById('supervisor-rascunhos-wrapper');
  if (listaRascunhos) listaRascunhos.insertBefore(cardSupervisor, listaRascunhos.firstChild);
  if (wrapperRascunhos) wrapperRascunhos.classList.remove('hidden');
  renderizarListaPDISupervisor();
  closeNovoPDISupervisorModal();
}

function enviarNovoPDISupervisor() {
  const dados = obterDadosFormNovoPDISupervisor();
  if (!dados.objetivo) { alert('Preencha o objetivo do PDI.'); return; }
  if (!dados.colaboradorId) { alert('Selecione o colaborador.'); return; }
  const id = 'pdi-' + Date.now();
  pdiStore[id] = {
    objetivo: dados.objetivo,
    tipoLabel: dados.tipoLabel,
    valor: dados.valor,
    comportamento: dados.comportamento,
    blocos: dados.blocos || [{ valor: dados.valor, comportamento: dados.comportamento, acoes: dados.acoes || [] }],
    status: 'em_andamento',
    contextoInicial: dados.contextoInicial || '',
    criadoPorSupervisor: true,
    colaboradorId: dados.colaboradorId,
    comentarios: [],
    acoes: dados.acoes || []
  };
  salvarPDINoStorage();
  const card = criarCardPDI({ ...dados, id, status: 'em_andamento', progresso: dados.progresso });
  document.getElementById('pdi-lista-aluno').insertBefore(card, document.getElementById('pdi-lista-aluno').firstChild);
  renderizarListaPDISupervisor();
  closeNovoPDISupervisorModal();
}

document.getElementById('modal-novo-pdi-supervisor')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeNovoPDISupervisorModal();
});

// Event listeners para botões do modal Novo PDI (supervisor)
document.getElementById('btn-novo-pdi-sup-cancelar')?.addEventListener('click', closeNovoPDISupervisorModal);
document.getElementById('btn-novo-pdi-sup-salvar-rascunho')?.addEventListener('click', salvarNovoPDISupervisorRascunho);
document.getElementById('btn-novo-pdi-sup-enviar')?.addEventListener('click', enviarNovoPDISupervisor);

// ========== ADMIN: Valor > Comportamentos > Ações ==========
let currentAdminValorNome = null;
let currentAdminComportamentoIdx = null;

function renderizarAdminValores() {
  const container = document.getElementById('admin-valores-lista');
  if (!container) return;
  container.innerHTML = '';
  Object.keys(VALORES_DATA).forEach(valorNome => {
    const comportamentos = VALORES_DATA[valorNome];
    const qtd = Array.isArray(comportamentos) ? comportamentos.length : 0;
    const valorId = 'valor-' + valorNome.replace(/\s+/g, '-').toLowerCase();
    const div = document.createElement('div');
    div.className = 'bg-dark-card rounded-lg border border-gray-700 overflow-hidden';
    div.innerHTML = `
      <button onclick="toggleValorConfig('${valorId}')" class="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-700/30 transition">
        <div class="flex items-center gap-3">
          <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
          <span class="font-medium">${(valorNome || '').replace(/</g, '&lt;')}</span>
          <span class="text-sm text-gray-400">${qtd} comportamento(s)</span>
        </div>
        <svg class="w-5 h-5 text-gray-400 valor-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
      </button>
      <div id="${valorId}" class="valor-config hidden border-t border-gray-700">
        <div class="p-6">
          <h4 class="text-primary font-medium mb-3">Comportamentos</h4>
          <div class="admin-comportamentos-lista space-y-3 mb-4" data-valor="${valorNome.replace(/"/g, '&quot;')}"></div>
          <button class="btn-add-comportamento px-4 py-2 bg-primary/20 text-primary hover:bg-primary/30 rounded-lg text-sm font-medium flex items-center gap-2" data-valor="${(valorNome || '').replace(/"/g, '&quot;')}">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Adicionar Comportamento
          </button>
        </div>
      </div>
    `;
    container.appendChild(div);
    const listaComp = div.querySelector('.admin-comportamentos-lista');
    (comportamentos || []).forEach((comp, idx) => {
      const nome = typeof comp === 'string' ? comp : comp.nome;
      const acoes = typeof comp === 'string' ? [] : (comp.acoes || []);
      const compDiv = document.createElement('div');
      compDiv.className = 'p-4 bg-dark-bg rounded-lg border border-gray-700';
      compDiv.dataset.valor = valorNome;
      compDiv.dataset.comportamentoIdx = String(idx);
      compDiv.innerHTML = `
        <div class="flex items-center justify-between mb-6">
          <p class="font-medium text-sm">${(nome || '').replace(/</g, '&lt;')}</p>
          <button class="btn-remover-comportamento text-red-400 hover:text-red-300 text-xs" data-valor="${(valorNome || '').replace(/"/g, '&quot;')}" data-idx="${idx}">Excluir</button>
        </div>
        <h5 class="text-xs text-gray-400 mb-2">Ações</h5>
        <div class="admin-acoes-lista space-y-2 mb-3"></div>
        <button class="btn-add-acao-admin px-3 py-1.5 bg-primary/20 text-primary hover:bg-primary/30 rounded text-xs font-medium flex items-center gap-1" data-valor="${(valorNome || '').replace(/"/g, '&quot;')}" data-comp-idx="${idx}">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Adicionar Ação
        </button>
      `;
      const acoesLista = compDiv.querySelector('.admin-acoes-lista');
      acoes.forEach((acao, ai) => {
        const acaoDiv = document.createElement('div');
        acaoDiv.className = 'flex items-center justify-between p-2 bg-dark-card rounded border border-gray-700';
        acaoDiv.innerHTML = `
          <p class="text-sm">${(acao || '').replace(/</g, '&lt;')}</p>
          <button class="btn-remover-acao-admin text-red-400 hover:text-red-300 text-xs" data-valor="${(valorNome || '').replace(/"/g, '&quot;')}" data-comp-idx="${idx}" data-acao-idx="${ai}">Excluir</button>
        `;
        acoesLista.appendChild(acaoDiv);
      });
      listaComp.appendChild(compDiv);
    });
  });
}

function removerComportamentoAdmin(valorNome, idx) {
  if (!VALORES_DATA[valorNome]) return;
  VALORES_DATA[valorNome].splice(idx, 1);
  salvarValoresNoStorage();
  renderizarAdminValores();
}

function removerAcaoAdmin(valorNome, compIdx, acaoIdx) {
  const comp = VALORES_DATA[valorNome]?.[compIdx];
  if (!comp || typeof comp === 'string') return;
  comp.acoes?.splice(acaoIdx, 1);
  salvarValoresNoStorage();
  renderizarAdminValores();
}

function toggleValorConfig(id) {
  const el = document.getElementById(id);
  const btn = el?.previousElementSibling;
  const chevron = btn?.querySelector('.valor-chevron');
  el?.classList.toggle('hidden');
  if (chevron) chevron.style.transform = el?.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
}

// ========== MODAL: NOVO VALOR (Admin) ==========
function openNovoValorModal() {
  document.getElementById('modal-novo-valor').classList.remove('hidden');
  document.getElementById('modal-novo-valor').classList.add('flex');
  document.getElementById('novo-valor-nome').value = '';
}

function closeNovoValorModal() {
  document.getElementById('modal-novo-valor').classList.add('hidden');
  document.getElementById('modal-novo-valor').classList.remove('flex');
}

function saveNovoValor() {
  const nome = document.getElementById('novo-valor-nome').value.trim();
  if (!nome) return;
  if (VALORES_DATA[nome]) { alert('Já existe um valor com esse nome.'); return; }
  VALORES_DATA[nome] = [];
  salvarValoresNoStorage();
  renderizarAdminValores();
  closeNovoValorModal();
}

document.getElementById('modal-novo-valor')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeNovoValorModal();
});

// ========== MODAL: NOVO COMPORTAMENTO (Admin) ==========
function openNovoComportamentoModal(valorNome) {
  currentAdminValorNome = valorNome;
  document.getElementById('modal-novo-comportamento').classList.remove('hidden');
  document.getElementById('modal-novo-comportamento').classList.add('flex');
  document.getElementById('novo-comportamento-nome').value = '';
}

function closeNovoComportamentoModal() {
  document.getElementById('modal-novo-comportamento').classList.add('hidden');
  document.getElementById('modal-novo-comportamento').classList.remove('flex');
  currentAdminValorNome = null;
}

function saveNovoComportamento() {
  const nome = document.getElementById('novo-comportamento-nome').value.trim();
  if (!nome || !currentAdminValorNome) return;
  if (!VALORES_DATA[currentAdminValorNome]) VALORES_DATA[currentAdminValorNome] = [];
  VALORES_DATA[currentAdminValorNome].push({ nome, acoes: [] });
  salvarValoresNoStorage();
  renderizarAdminValores();
  closeNovoComportamentoModal();
}

document.getElementById('modal-novo-comportamento')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeNovoComportamentoModal();
});

// ========== MODAL: NOVA AÇÃO (Admin) ==========
function openNovaAcaoAdminModal(valorNome, comportamentoIdx) {
  currentAdminValorNome = valorNome;
  currentAdminComportamentoIdx = comportamentoIdx;
  document.getElementById('modal-nova-acao-admin').classList.remove('hidden');
  document.getElementById('modal-nova-acao-admin').classList.add('flex');
  document.getElementById('nova-acao-admin-titulo').value = '';
}

function closeNovaAcaoAdminModal() {
  document.getElementById('modal-nova-acao-admin').classList.add('hidden');
  document.getElementById('modal-nova-acao-admin').classList.remove('flex');
  currentAdminValorNome = null;
  currentAdminComportamentoIdx = null;
}

function saveNovaAcaoAdmin() {
  const titulo = document.getElementById('nova-acao-admin-titulo').value.trim();
  if (!titulo || currentAdminValorNome == null || currentAdminComportamentoIdx == null) return;
  const comp = VALORES_DATA[currentAdminValorNome]?.[currentAdminComportamentoIdx];
  if (!comp || typeof comp === 'string') return;
  if (!comp.acoes) comp.acoes = [];
  comp.acoes.push(titulo);
  salvarValoresNoStorage();
  renderizarAdminValores();
  closeNovaAcaoAdminModal();
}

document.getElementById('modal-nova-acao-admin')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeNovaAcaoAdminModal();
});

// Delegação de cliques na visão admin (usa document para garantir que funcione com conteúdo dinâmico)
document.addEventListener('click', (e) => {
  if (!document.getElementById('view-admin')?.contains(e.target)) return;
  const btn = e.target.closest('.btn-add-comportamento');
  if (btn) { e.preventDefault(); openNovoComportamentoModal(btn.dataset.valor || ''); return; }
  const btnAcao = e.target.closest('.btn-add-acao-admin');
  if (btnAcao) { e.preventDefault(); openNovaAcaoAdminModal(btnAcao.dataset.valor || '', parseInt(btnAcao.dataset.compIdx || '0', 10)); return; }
  const btnRemComp = e.target.closest('.btn-remover-comportamento');
  if (btnRemComp) { e.preventDefault(); removerComportamentoAdmin(btnRemComp.dataset.valor || '', parseInt(btnRemComp.dataset.idx || '0', 10)); return; }
  const btnRemAcao = e.target.closest('.btn-remover-acao-admin');
  if (btnRemAcao) { e.preventDefault(); removerAcaoAdmin(btnRemAcao.dataset.valor || '', parseInt(btnRemAcao.dataset.compIdx || '0', 10), parseInt(btnRemAcao.dataset.acaoIdx || '0', 10)); return; }
});
