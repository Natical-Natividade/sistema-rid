const STORAGE_KEY = "rids_v1";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const views = {
  dashboard: $("#view-dashboard"),
  rids: $("#view-rids"),
  relatorios: $("#view-relatorios"),
  config: $("#view-config"),
};

const pageTitle = $("#pageTitle");
const pageSubtitle = $("#pageSubtitle");

const modal = $("#modal");
const formRid = $("#formRid");

const kpiTotal = $("#kpiTotal");
const kpiAbertos = $("#kpiAbertos");
const kpiAndamento = $("#kpiAndamento");
const kpiConcluidos = $("#kpiConcluidos");

const tableUltimosBody = $("#tableUltimos tbody");
const tableRidsBody = $("#tableRids tbody");

const filtroStatus = $("#filtroStatus");
const filtroPrioridade = $("#filtroPrioridade");
const globalSearch = $("#globalSearch");

let rids = loadRids();

init();
renderAll();

function init() {
  // Navegação
  $$(".navItem").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$(".navItem").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      showView(btn.dataset.view);
    });
  });

  // Modal
  $("#btnNovoRid").addEventListener("click", () => openModal());
  $("#btnCancelar").addEventListener("click", closeModal);
  $("#btnFecharModal").addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

  // Form submit
  formRid.addEventListener("submit", (e) => {
    e.preventDefault();
    saveFromForm();
  });

  // Filtros
  filtroStatus.addEventListener("change", renderRidsTable);
  filtroPrioridade.addEventListener("change", renderRidsTable);
  globalSearch.addEventListener("input", () => {
    renderRidsTable();
    renderDashboardTable();
  });

  // Export
  $("#btnExportar").addEventListener("click", exportCSV);

  // Config
  $("#btnResetar").addEventListener("click", () => {
    if (!confirm("Apagar todos os RIDs?")) return;
    rids = [];
    persist();
    renderAll();
    showView("dashboard");
  });

  $("#btnSeed").addEventListener("click", () => {
    rids = seed();
    persist();
    renderAll();
    showView("dashboard");
  });

  // Data default no modal
  $("#ridData").valueAsDate = new Date();
}

function showView(name) {
  Object.entries(views).forEach(([k, el]) => el.classList.toggle("hidden", k !== name));

  const meta = {
    dashboard: ["Dashboard", "Visão geral do sistema"],
    rids: ["RIDs", "Cadastro e gestão de RIDs"],
    relatorios: ["Relatórios", "Resumo por status e prioridade"],
    config: ["Config", "Ajustes e manutenção"],
  };

  pageTitle.textContent = meta[name][0];
  pageSubtitle.textContent = meta[name][1];
}

function renderAll() {
  renderKPIs();
  renderDashboardTable();
  renderRidsTable();
  renderReports();
}

function renderKPIs() {
  const total = rids.length;
  const abertos = rids.filter((r) => r.status === "ABERTO").length;
  const andamento = rids.filter((r) => r.status === "ANDAMENTO").length;
  const concluidos = rids.filter((r) => r.status === "CONCLUIDO").length;

  kpiTotal.textContent = total;
  kpiAbertos.textContent = abertos;
  kpiAndamento.textContent = andamento;
  kpiConcluidos.textContent = concluidos;
}

function renderDashboardTable() {
  tableUltimosBody.innerHTML = "";
  const term = (globalSearch.value || "").trim().toLowerCase();

  const last = [...rids]
    .sort((a, b) => (b.data || "").localeCompare(a.data || ""))
    .filter((r) => matchTerm(r, term))
    .slice(0, 8);

  if (last.length === 0) {
    tableUltimosBody.innerHTML = `<tr><td colspan="6" class="muted">Nenhum RID encontrado.</td></tr>`;
    return;
  }

  last.forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(r.numero)}</td>
      <td>${escapeHtml(r.titulo)}</td>
      <td>${statusBadge(r.status)}</td>
      <td>${escapeHtml(r.prioridade)}</td>
      <td>${escapeHtml(r.solicitante || "-")}</td>
      <td>${formatDate(r.data)}</td>
    `;
    tableUltimosBody.appendChild(tr);
  });
}

function renderRidsTable() {
  tableRidsBody.innerHTML = "";

  const term = (globalSearch.value || "").trim().toLowerCase();
  const s = filtroStatus.value;
  const p = filtroPrioridade.value;

  const list = rids
    .filter((r) => (s ? r.status === s : true))
    .filter((r) => (p ? r.prioridade === p : true))
    .filter((r) => matchTerm(r, term))
    .sort((a, b) => (b.data || "").localeCompare(a.data || ""));

  if (list.length === 0) {
    tableRidsBody.innerHTML = `<tr><td colspan="7" class="muted">Nenhum RID encontrado.</td></tr>`;
    return;
  }

  list.forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(r.numero)}</td>
      <td>${escapeHtml(r.titulo)}</td>
      <td>${statusBadge(r.status)}</td>
      <td>${escapeHtml(r.prioridade)}</td>
      <td>${escapeHtml(r.solicitante || "-")}</td>
      <td>${formatDate(r.data)}</td>
      <td class="right">
        <button class="btn" data-edit="${r.id}">Editar</button>
        <button class="btn danger" data-del="${r.id}">Excluir</button>
      </td>
    `;
    tableRidsBody.appendChild(tr);
  });

  // Ações
  $$("[data-edit]").forEach((b) => b.addEventListener("click", () => editRid(b.dataset.edit)));
  $$("[data-del]").forEach((b) => b.addEventListener("click", () => delRid(b.dataset.del)));
}

function renderReports() {
  const byStatus = groupCount(rids, "status");
  const byPrio = groupCount(rids, "prioridade");

  $("#repStatus").innerHTML = lines(byStatus, ["ABERTO", "ANDAMENTO", "CONCLUIDO"]);
  $("#repPrioridade").innerHTML = lines(byPrio, ["ALTA", "MEDIA", "BAIXA"]);
}

function lines(obj, order) {
  return order
    .map((k) => `<div><strong>${k}</strong>: ${obj[k] || 0}</div>`)
    .join("");
}

function groupCount(arr, key) {
  return arr.reduce((acc, it) => {
    const k = it[key] || "—";
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
}

function openModal(rid = null) {
  $("#modalTitle").textContent = rid ? "Editar RID" : "Novo RID";
  $("#ridId").value = rid?.id || "";
  $("#ridNumero").value = rid?.numero || "";
  $("#ridTitulo").value = rid?.titulo || "";
  $("#ridStatus").value = rid?.status || "ABERTO";
  $("#ridPrioridade").value = rid?.prioridade || "MEDIA";
  $("#ridSolicitante").value = rid?.solicitante || "";
  $("#ridData").value = rid?.data || new Date().toISOString().slice(0, 10);

  modal.classList.remove("hidden");
}

function closeModal() {
  modal.classList.add("hidden");
  formRid.reset();
  $("#ridData").valueAsDate = new Date();
  $("#ridId").value = "";
}

function saveFromForm() {
  const id = $("#ridId").value || cryptoId();
  const rid = {
    id,
    numero: $("#ridNumero").value.trim(),
    titulo: $("#ridTitulo").value.trim(),
    status: $("#ridStatus").value,
    prioridade: $("#ridPrioridade").value,
    solicitante: $("#ridSolicitante").value.trim(),
    data: $("#ridData").value,
  };

  // validação simples
  if (!rid.numero || !rid.titulo || !rid.data) {
    alert("Preencha Número, Título e Data.");
    return;
  }

  const idx = rids.findIndex((r) => r.id === id);
  if (idx >= 0) rids[idx] = rid;
  else rids.push(rid);

  persist();
  renderAll();
  closeModal();
}

function editRid(id) {
  const rid = rids.find((r) => r.id === id);
  if (!rid) return;
  openModal(rid);
}

function delRid(id) {
  if (!confirm("Excluir este RID?")) return;
  rids = rids.filter((r) => r.id !== id);
  persist();
  renderAll();
}

function exportCSV() {
  if (rids.length === 0) return alert("Não há dados para exportar.");
  const head = ["numero","titulo","status","prioridade","solicitante","data"];
  const rows = rids.map(r => head.map(h => csvCell(r[h] ?? "")));
  const csv = [head.join(","), ...rows.map(r => r.join(","))].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "rids.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function csvCell(v) {
  const s = String(v).replaceAll('"', '""');
  return `"${s}"`;
}

function matchTerm(r, term) {
  if (!term) return true;
  return (
    String(r.numero || "").toLowerCase().includes(term) ||
    String(r.titulo || "").toLowerCase().includes(term) ||
    String(r.solicitante || "").toLowerCase().includes(term) ||
    String(r.status || "").toLowerCase().includes(term) ||
    String(r.prioridade || "").toLowerCase().includes(term)
  );
}

function statusBadge(status) {
  const map = {
    ABERTO: ["Aberto", "open"],
    ANDAMENTO: ["Em andamento", "go"],
    CONCLUIDO: ["Concluído", "done"],
  };
  const [label, cls] = map[status] || [status, "open"];
  return `<span class="badge"><span class="dot ${cls}"></span>${label}</span>`;
}

function formatDate(iso) {
  if (!iso) return "-";
  const [y,m,d] = iso.split("-");
  if (!y) return iso;
  return `${d}/${m}/${y}`;
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rids));
}

function loadRids() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function cryptoId() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function seed() {
  const today = new Date().toISOString().slice(0, 10);
  return [
    { id: cryptoId(), numero:"1001", titulo:"Revisão de procedimento", status:"ABERTO", prioridade:"ALTA", solicitante:"Admin", data:today },
    { id: cryptoId(), numero:"1002", titulo:"Ajuste no fluxo de atendimento", status:"ANDAMENTO", prioridade:"MEDIA", solicitante:"Equipe", data:today },
    { id: cryptoId(), numero:"1003", titulo:"Correção de relatório mensal", status:"CONCLUIDO", prioridade:"BAIXA", solicitante:"Gestão", data:today },
  ];
}

function renderAllAndGoRids(){
  renderAll();
  showView("rids");
}

function renderAll(){
  renderKPIs();
  renderDashboardTable();
  renderRidsTable();
  renderReports();
}
