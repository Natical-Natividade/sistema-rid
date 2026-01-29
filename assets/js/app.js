// =========================
// Sistema RID (sem login) - estilo “simples” parecido com o original
// Persistência: localStorage
// =========================

const LS_KEY = "rid_items_v1";

const app = document.getElementById("app");

// Estado
let state = {
  view: "dashboard", // dashboard | rids | relatorios | config
  rids: loadRids(),
  search: "",
  filterStatus: "Todos",
  filterPrioridade: "Todas",
  modalOpen: false,
  editingId: null,
};

// -------------------------
// Storage
// -------------------------
function loadRids() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRids() {
  localStorage.setItem(LS_KEY, JSON.stringify(state.rids));
}

function nowISODate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function padRid(n) {
  const s = String(n);
  return s.padStart(4, "0");
}

function nextRidNumber() {
  // pega maior número existente e soma 1
  let max = 0;
  for (const r of state.rids) {
    const num = parseInt(String(r.numero).replace(/\D/g, ""), 10);
    if (!Number.isNaN(num)) max = Math.max(max, num);
  }
  return padRid(max + 1);
}

// -------------------------
// Helpers
// -------------------------
function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setView(view) {
  state.view = view;
  render();
}

function openModalNew(editId = null) {
  state.modalOpen = true;
  state.editingId = editId;
  render();
}

function closeModal() {
  state.modalOpen = false;
  state.editingId = null;
  render();
}

function deleteRid(id) {
  state.rids = state.rids.filter(r => r.id !== id);
  saveRids();
  render();
}

function updateFilters({ search, status, prioridade }) {
  if (search !== undefined) state.search = search;
  if (status !== undefined) state.filterStatus = status;
  if (prioridade !== undefined) state.filterPrioridade = prioridade;
  render();
}

function filteredRids() {
  let list = [...state.rids];

  // busca
  const q = state.search.trim().toLowerCase();
  if (q) {
    list = list.filter(r => {
      const hay = [
        r.numero,
        r.titulo,
        r.solicitante,
        r.status,
        r.prioridade
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }

  // filtros
  if (state.filterStatus !== "Todos") {
    list = list.filter(r => r.status === state.filterStatus);
  }
  if (state.filterPrioridade !== "Todas") {
    list = list.filter(r => r.prioridade === state.filterPrioridade);
  }

  // ordenação: data desc, numero desc
  list.sort((a, b) => {
    const da = a.data || "";
    const db = b.data || "";
    if (da !== db) return db.localeCompare(da);
    return String(b.numero).localeCompare(String(a.numero));
  });

  return list;
}

function counts() {
  const total = state.rids.length;
  const abertos = state.rids.filter(r => r.status === "Aberto").length;
  const andamento = state.rids.filter(r => r.status === "Em andamento").length;
  const concluidos = state.rids.filter(r => r.status === "Concluído").length;
  return { total, abertos, andamento, concluidos };
}

function downloadCSV(rows) {
  const header = ["Nº", "Data", "Título", "Status", "Prioridade", "Solicitante"];
  const csv = [
    header.join(";"),
    ...rows.map(r => [
      r.numero,
      r.data,
      (r.titulo || "").replaceAll(";", ","),
      r.status,
      r.prioridade,
      (r.solicitante || "").replaceAll(";", ",")
    ].join(";"))
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `rids_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// -------------------------
// Render
// -------------------------
function render() {
  // container igual ao estilo “simples”: tudo à esquerda
  app.innerHTML = `
    <div class="max-w-[900px]">
      ${renderTopInfo()}
      ${renderCurrentView()}
      ${renderFooter()}
      ${state.modalOpen ? renderModal() : ""}
    </div>
  `;

  wireEvents();
}

function renderTopInfo() {
  return `
    <div class="mb-6">
      <div class="text-sm text-slate-300">© Sistema RID v1.0</div>
    </div>
  `;
}

function renderCurrentView() {
  switch (state.view) {
    case "dashboard":
      return renderDashboard();
    case "rids":
      return renderRids();
    case "relatorios":
      return renderRelatorios();
    case "config":
      return renderConfig();
    default:
      return renderDashboard();
  }
}

function renderDashboard() {
  const c = counts();
  const latest = filteredRids().slice(0, 10);

  return `
    <h2 class="text-4xl font-extrabold text-blue-400 mb-4">Dashboard</h2>
    <p class="mb-4 text-slate-200">Visão geral do sistema</p>

    <div class="mb-3">
      <input
        id="searchTop"
        class="text-black px-2 py-1 rounded"
        style="width: 220px"
        placeholder="Buscar RID, título, solicitante"
        value="${escapeHtml(state.search)}"
      />
    </div>

    <div class="mb-4">
      <button class="bg-white text-black px-2 py-1 rounded" id="btnNewRidTop">+ Novo RID</button>
    </div>

    <div class="mb-4 leading-tight">
      <div><b>Total de RIDs</b></div>
      <div>${c.total}</div>
      <div class="mt-2"><b>Abertos</b></div>
      <div>${c.abertos}</div>
      <div class="mt-2"><b>Em andamento</b></div>
      <div>${c.andamento}</div>
      <div class="mt-2"><b>Concluídos</b></div>
      <div>${c.concluidos}</div>
    </div>

    <div class="mt-6">
      <div class="font-bold mb-2">Últimos RIDs <span class="text-slate-300 font-normal">Atualização automática</span></div>
      <div class="text-sm font-semibold mb-1">Nº&nbsp;&nbsp;Título&nbsp;&nbsp;Status&nbsp;&nbsp;Prioridade&nbsp;&nbsp;Solicitante&nbsp;&nbsp;Data</div>
      <div class="space-y-1">
        ${
          latest.length
            ? latest.map(r => `
              <div class="text-sm">
                ${escapeHtml(r.numero)}&nbsp;&nbsp;
                ${escapeHtml(r.titulo)}&nbsp;&nbsp;
                ${escapeHtml(r.status)}&nbsp;&nbsp;
                ${escapeHtml(r.prioridade)}&nbsp;&nbsp;
                ${escapeHtml(r.solicitante)}&nbsp;&nbsp;
                ${escapeHtml(r.data)}
              </div>
            `).join("")
            : `<div class="text-sm text-slate-300">Nenhum RID ainda.</div>`
        }
      </div>
    </div>

    <div class="mt-10">
      <div class="font-bold mb-2">Lista de RIDs</div>

      <div class="flex items-center gap-2 mb-2">
        <select id="dashFilterStatus" class="text-black px-2 py-1 rounded">
          ${["Todos","Aberto","Em andamento","Concluído"].map(s => `
            <option ${s === state.filterStatus ? "selected" : ""}>${s}</option>
          `).join("")}
        </select>

        <select id="dashFilterPrioridade" class="text-black px-2 py-1 rounded">
          ${["Todas","Baixa","Média","Alta"].map(s => `
            <option ${s === state.filterPrioridade ? "selected" : ""}>${s}</option>
          `).join("")}
        </select>

        <button id="btnExportDash" class="bg-white text-black px-2 py-1 rounded">Exportar CSV</button>
      </div>

      <div class="text-sm font-semibold mb-1">Nº&nbsp;&nbsp;Título&nbsp;&nbsp;Status&nbsp;&nbsp;Prioridade&nbsp;&nbsp;Solicitante&nbsp;&nbsp;Data&nbsp;&nbsp;Ações</div>

      <div class="space-y-1">
        ${
          filteredRids().length
            ? filteredRids().slice(0, 30).map(r => `
              <div class="text-sm">
                ${escapeHtml(r.numero)}&nbsp;&nbsp;
                ${escapeHtml(r.titulo)}&nbsp;&nbsp;
                ${escapeHtml(r.status)}&nbsp;&nbsp;
                ${escapeHtml(r.prioridade)}&nbsp;&nbsp;
                ${escapeHtml(r.solicitante)}&nbsp;&nbsp;
                ${escapeHtml(r.data)}&nbsp;&nbsp;
                <button class="underline" data-edit="${r.id}">Editar</button>
                <button class="underline" data-del="${r.id}">Excluir</button>
              </div>
            `).join("")
            : `<div class="text-sm text-slate-300">Nenhum resultado.</div>`
        }
      </div>
    </div>

    <div class="mt-8">
      <div class="font-bold mb-1">Configurações</div>
      <div class="text-slate-200">
        Armazenamento local (navegador)
      </div>
      <div class="text-slate-200 mt-2">
        Seus RIDs estão sendo salvos no navegador (localStorage). Se trocar de computador ou limpar o cache, os dados somem.
        Depois a gente pode ligar isso em um banco/planilha.
      </div>

      <div class="mt-3 flex gap-2">
        <button id="btnWipe" class="bg-white text-black px-2 py-1 rounded">Apagar todos os RIDs</button>
        <button id="btnSeed" class="bg-white text-black px-2 py-1 rounded">Criar exemplos</button>
      </div>
    </div>
  `;
}

function renderRids() {
  return `
    <h2 class="text-3xl font-extrabold text-blue-400 mb-4">RIDs</h2>

    <div class="mb-3">
      <input
        id="searchRids"
        class="text-black px-2 py-1 rounded"
        style="width: 260px"
        placeholder="Buscar RID, título, solicitante"
        value="${escapeHtml(state.search)}"
      />
      <button class="bg-white text-black px-2 py-1 rounded ml-2" id="btnNewRidList">+ Novo RID</button>
    </div>

    <div class="flex items-center gap-2 mb-3">
      <label class="text-slate-200 text-sm">Status</label>
      <select id="listFilterStatus" class="text-black px-2 py-1 rounded">
        ${["Todos","Aberto","Em andamento","Concluído"].map(s => `
          <option ${s === state.filterStatus ? "selected" : ""}>${s}</option>
        `).join("")}
      </select>

      <label class="text-slate-200 text-sm ml-3">Prioridade</label>
      <select id="listFilterPrioridade" class="text-black px-2 py-1 rounded">
        ${["Todas","Baixa","Média","Alta"].map(s => `
          <option ${s === state.filterPrioridade ? "selected" : ""}>${s}</option>
        `).join("")}
      </select>

      <button id="btnExportList" class="bg-white text-black px-2 py-1 rounded ml-2">Exportar CSV</button>
    </div>

    <div class="text-sm font-semibold mb-1">
      Nº&nbsp;&nbsp;Título&nbsp;&nbsp;Status&nbsp;&nbsp;Prioridade&nbsp;&nbsp;Solicitante&nbsp;&nbsp;Data&nbsp;&nbsp;Ações
    </div>

    <div class="space-y-1">
      ${
        filteredRids().length
          ? filteredRids().map(r => `
            <div class="text-sm">
              ${escapeHtml(r.numero)}&nbsp;&nbsp;
              ${escapeHtml(r.titulo)}&nbsp;&nbsp;
              ${escapeHtml(r.status)}&nbsp;&nbsp;
              ${escapeHtml(r.prioridade)}&nbsp;&nbsp;
              ${escapeHtml(r.solicitante)}&nbsp;&nbsp;
              ${escapeHtml(r.data)}&nbsp;&nbsp;
              <button class="underline" data-edit="${r.id}">Editar</button>
              <button class="underline" data-del="${r.id}">Excluir</button>
            </div>
          `).join("")
          : `<div class="text-sm text-slate-300">Nenhum RID cadastrado.</div>`
      }
    </div>
  `;
}

function renderRelatorios() {
  const total = state.rids.length;

  const byStatus = ["Aberto","Em andamento","Concluído"].map(s => ({
    name: s,
    count: state.rids.filter(r => r.status === s).length
  }));

  const byPrioridade = ["Baixa","Média","Alta"].map(p => ({
    name: p,
    count: state.rids.filter(r => r.prioridade === p).length
  }));

  return `
    <h2 class="text-3xl font-extrabold text-blue-400 mb-4">Relatórios</h2>
    <div class="text-slate-200 mb-2">Resumo por status e prioridade</div>

    <div class="mt-3">
      <div class="font-bold">Total</div>
      <div>${total}</div>
    </div>

    <div class="mt-6">
      <div class="font-bold">Por Status</div>
      ${byStatus.map(x => `<div>${escapeHtml(x.name)}: ${x.count}</div>`).join("")}
    </div>

    <div class="mt-6">
      <div class="font-bold">Por Prioridade</div>
      ${byPrioridade.map(x => `<div>${escapeHtml(x.name)}: ${x.count}</div>`).join("")}
    </div>

    <div class="mt-6">
      <button id="btnExportRel" class="bg-white text-black px-2 py-1 rounded">Exportar CSV</button>
    </div>
  `;
}

function renderConfig() {
  return `
    <h2 class="text-3xl font-extrabold text-blue-400 mb-4">Config</h2>

    <div class="text-slate-200 mb-2">
      Configurações Armazenamento local (navegador)
    </div>

    <div class="text-slate-200">
      Seus RIDs estão sendo salvos no navegador (localStorage). Se trocar de computador ou limpar o cache, os dados somem.
    </div>

    <div class="mt-4 flex gap-2">
      <button id="btnWipe2" class="bg-white text-black px-2 py-1 rounded">Apagar todos os RIDs</button>
      <button id="btnSeed2" class="bg-white text-black px-2 py-1 rounded">Criar exemplos</button>
    </div>
  `;
}

function renderFooter() {
  return `
    <div class="mt-10 text-slate-300 text-sm">
      © Todos os direitos reservados.
    </div>
  `;
}

function renderModal() {
  const editing = state.editingId
    ? state.rids.find(r => r.id === state.editingId)
    : null;

  const numero = editing?.numero ?? nextRidNumber();
  const data = editing?.data ?? nowISODate();
  const titulo = editing?.titulo ?? "";
  const status = editing?.status ?? "Aberto";
  const prioridade = editing?.prioridade ?? "Baixa";
  const solicitante = editing?.solicitante ?? "";

  return `
    <div class="fixed inset-0 bg-black/60 flex items-end md:items-center justify-start p-4 z-50">
      <div class="bg-white text-black rounded p-4 w-[320px]">
        <div class="flex items-center justify-between mb-2">
          <div class="font-bold">Novo RID</div>
          <button id="btnCloseModal" class="px-2">X</button>
        </div>

        <div class="space-y-2 text-sm">
          <div>
            <div class="font-bold">Número</div>
            <input id="mNumero" value="${escapeHtml(numero)}" class="w-full border border-gray-300" />
          </div>

          <div>
            <div class="font-bold">Data</div>
            <input id="mData" type="date" value="${escapeHtml(data)}" class="w-full border border-gray-300" />
          </div>

          <div>
            <div class="font-bold">Título</div>
            <input id="mTitulo" value="${escapeHtml(titulo)}" placeholder="Ex: Ajuste de processo..." class="w-full border border-gray-300" />
          </div>

          <div>
            <div class="font-bold">Status</div>
            <select id="mStatus" class="w-full border border-gray-300">
              ${["Aberto","Em andamento","Concluído"].map(s => `
                <option ${s === status ? "selected" : ""}>${s}</option>
              `).join("")}
            </select>
          </div>

          <div>
            <div class="font-bold">Prioridade</div>
            <select id="mPrioridade" class="w-full border border-gray-300">
              ${["Baixa","Média","Alta"].map(p => `
                <option ${p === prioridade ? "selected" : ""}>${p}</option>
              `).join("")}
            </select>
          </div>

          <div>
            <div class="font-bold">Solicitante</div>
            <input id="mSolicitante" value="${escapeHtml(solicitante)}" placeholder="Nome de quem solicitou" class="w-full border border-gray-300" />
          </div>

          <div class="flex gap-2 pt-2">
            <button id="btnCancelModal" class="bg-gray-200 px-2 py-1 rounded">Cancelar</button>
            <button id="btnSaveModal" class="bg-blue-600 text-white px-2 py-1 rounded">Salvar</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// -------------------------
// Events
// -------------------------
function wireEvents() {
  // barra de cima (os botões estão no index.html)
  // Nada aqui.

  // Busca (dashboard)
  const searchTop = document.getElementById("searchTop");
  if (searchTop) {
    searchTop.addEventListener("input", (e) => updateFilters({ search: e.target.value }));
  }

  // Busca (rids)
  const searchRids = document.getElementById("searchRids");
  if (searchRids) {
    searchRids.addEventListener("input", (e) => updateFilters({ search: e.target.value }));
  }

  // Filtros (dashboard)
  const dashFilterStatus = document.getElementById("dashFilterStatus");
  if (dashFilterStatus) {
    dashFilterStatus.addEventListener("change", (e) => updateFilters({ status: e.target.value }));
  }
  const dashFilterPrioridade = document.getElementById("dashFilterPrioridade");
  if (dashFilterPrioridade) {
    dashFilterPrioridade.addEventListener("change", (e) => updateFilters({ prioridade: e.target.value }));
  }

  // Filtros (lista)
  const listFilterStatus = document.getElementById("listFilterStatus");
  if (listFilterStatus) {
    listFilterStatus.addEventListener("change", (e) => updateFilters({ status: e.target.value }));
  }
  const listFilterPrioridade = document.getElementById("listFilterPrioridade");
  if (listFilterPrioridade) {
    listFilterPrioridade.addEventListener("change", (e) => updateFilters({ prioridade: e.target.value }));
  }

  // Botões Novo RID
  const btnNewRidTop = document.getElementById("btnNewRidTop");
  if (btnNewRidTop) btnNewRidTop.addEventListener("click", () => openModalNew());

  const btnNewRidList = document.getElementById("btnNewRidList");
  if (btnNewRidList) btnNewRidList.addEventListener("click", () => openModalNew());

  // Export CSV
  const btnExportDash = document.getElementById("btnExportDash");
  if (btnExportDash) btnExportDash.addEventListener("click", () => downloadCSV(filteredRids()));

  const btnExportList = document.getElementById("btnExportList");
  if (btnExportList) btnExportList.addEventListener("click", () => downloadCSV(filteredRids()));

  const btnExportRel = document.getElementById("btnExportRel");
  if (btnExportRel) btnExportRel.addEventListener("click", () => downloadCSV(filteredRids()));

  // Wipe / Seed
  const btnWipe = document.getElementById("btnWipe");
  if (btnWipe) btnWipe.addEventListener("click", wipeAll);

  const btnSeed = document.getElementById("btnSeed");
  if (btnSeed) btnSeed.addEventListener("click", seedExamples);

  const btnWipe2 = document.getElementById("btnWipe2");
  if (btnWipe2) btnWipe2.addEventListener("click", wipeAll);

  const btnSeed2 = document.getElementById("btnSeed2");
  if (btnSeed2) btnSeed2.addEventListener("click", seedExamples);

  // Edit/Delete inline
  document.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => openModalNew(btn.getAttribute("data-edit")));
  });
  document.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", () => deleteRid(btn.getAttribute("data-del")));
  });

  // Modal events
  if (state.modalOpen) {
    const btnCloseModal = document.getElementById("btnCloseModal");
    const btnCancelModal = document.getElementById("btnCancelModal");
    const btnSaveModal = document.getElementById("btnSaveModal");

    if (btnCloseModal) btnCloseModal.addEventListener("click", closeModal);
    if (btnCancelModal) btnCancelModal.addEventListener("click", closeModal);

    if (btnSaveModal) {
      btnSaveModal.addEventListener("click", () => {
        const numero = document.getElementById("mNumero").value.trim() || nextRidNumber();
        const data = document.getElementById("mData").value || nowISODate();
        const titulo = document.getElementById("mTitulo").value.trim();
        const status = document.getElementById("mStatus").value;
        const prioridade = document.getElementById("mPrioridade").value;
        const solicitante = document.getElementById("mSolicitante").value.trim();

        if (!titulo) {
          alert("Preencha o Título.");
          return;
        }

        if (state.editingId) {
          state.rids = state.rids.map(r => {
            if (r.id !== state.editingId) return r;
            return { ...r, numero, data, titulo, status, prioridade, solicitante };
          });
        } else {
          state.rids.push({
            id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
            numero,
            data,
            titulo,
            status,
            prioridade,
            solicitante,
          });
        }

        saveRids();
        closeModal();
      });
    }
  }
}

// -------------------------
// Actions
// -------------------------
function wipeAll() {
  const ok = confirm("Tem certeza que deseja apagar todos os RIDs?");
  if (!ok) return;
  state.rids = [];
  saveRids();
  render();
}

function seedExamples() {
  const base = [
    { titulo: "Ajuste de processo", status: "Aberto", prioridade: "Média", solicitante: "JOÃO" },
    { titulo: "Troca de componente", status: "Em andamento", prioridade: "Alta", solicitante: "MARIA" },
    { titulo: "Conferência final", status: "Concluído", prioridade: "Baixa", solicitante: "CARLOS" },
  ];

  const today = nowISODate();

  for (const b of base) {
    state.rids.push({
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
      numero: nextRidNumber(),
      data: today,
      titulo: b.titulo,
      status: b.status,
      prioridade: b.prioridade,
      solicitante: b.solicitante,
    });
  }

  saveRids();
  render();
}

// -------------------------
// Navegação (chamado pelos botões do menu do index.html)
// -------------------------
window.showDashboard = () => setView("dashboard");
window.showRIDs = () => setView("rids");
window.showRelatorios = () => setView("relatorios");
window.showConfig = () => setView("config");

// Start
render();
