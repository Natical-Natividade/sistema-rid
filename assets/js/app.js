/* =========================
   Sistema RID (sem login)
   SPA simples com localStorage
   ========================= */

const STORAGE_KEY = "rid_app_v1";

/** Usuário fixo (por enquanto) */
const currentUser = {
  name: "TESTE DEV NATICAL",
  role: "Desenvolvedor",
  unit: "FORMACAL",
};

/** Estado */
let state = loadState();

/* ---------- Boot ---------- */
window.addEventListener("hashchange", render);
window.addEventListener("load", () => {
  if (!location.hash) location.hash = "#dashboard";
  render();
});

/* ---------- Storage ---------- */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed inicial para você ver funcionando
      const seed = {
        users: [
          { id: id(), name: "ALCIONE SANTOS", cpf: "602.600.513-73", sector: "PRODUÇÃO", type: "Funcionário" },
          { id: id(), name: "AMANDA FERREIRA", cpf: "059.564.301-92", sector: "M. MOVEL", type: "Funcionário" },
          { id: id(), name: "AMILTON LIMA", cpf: "692.643.252-04", sector: "ADM", type: "Funcionário" },
        ],
        rids: [
          {
            id: id(),
            number: "00280",
            emissionDate: "2026-01-28",
            emitter: "CLAUDINEIA SANTOS",
            type: "Funcionário",
            sector: "ADM",
            local: "Expedição",
            genesis: "Dano Material",
            origin: "CSL",
            description: "Mudança dos extintores da balança",
            priority: "Baixo",
            status: "CORRIGIDO",
            responsible: "",
          },
          {
            id: id(),
            number: "00279",
            emissionDate: "2026-01-28",
            emitter: "CLAUDINEIA SANTOS",
            type: "Funcionário",
            sector: "ADM",
            local: "Portaria",
            genesis: "Dano Material",
            origin: "CSL",
            description: "Adesivo da lixeira dos fumantes, apagada",
            priority: "Baixo",
            status: "VENCIDO",
            responsible: "",
          },
          {
            id: id(),
            number: "00278",
            emissionDate: "2026-01-28",
            emitter: "CLAUDINEIA SANTOS",
            type: "Funcionário",
            sector: "ADM",
            local: "Expedição",
            genesis: "Desvio Comportamental",
            origin: "CSL",
            description: "Necessidade de organizar caixas de arquivo morto",
            priority: "Médio",
            status: "EM ANDAMENTO",
            responsible: "",
          },
        ],
        requests: {
          ridRemoval: [],
          userDeletion: [],
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.warn("Erro ao carregar state, recriando...", e);
    localStorage.removeItem(STORAGE_KEY);
    return loadState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* ---------- Utils ---------- */
function id() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}
function $(sel) {
  return document.querySelector(sel);
}
function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function formatDateISO(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
function toCSV(rows, headers) {
  const sep = ";";
  const line = (arr) =>
    arr
      .map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`)
      .join(sep);
  return [line(headers), ...rows.map((r) => line(r))].join("\n");
}
function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ---------- Router ---------- */
function route() {
  const h = (location.hash || "#dashboard").replace("#", "");
  return h;
}

/* ---------- Render Root ---------- */
function render() {
  const page = route();
  const app = $("#app");
  app.innerHTML = layout(page);

  bindNav(page);

  // Render conteúdo
  const view = $("#view");
  if (page === "dashboard") view.innerHTML = pageDashboard();
  else if (page === "rids") view.innerHTML = pageRids();
  else if (page === "meusrids") view.innerHTML = pageMeusRids();
  else if (page === "funcionarios") view.innerHTML = pageFuncionarios();
  else if (page === "solicitacoes") view.innerHTML = pageSolicitacoes();
  else if (page === "relatorios") view.innerHTML = pageRelatorios();
  else if (page === "controle") view.innerHTML = pageCentroControle();
  else view.innerHTML = pageDashboard();

  // binds específicos
  bindCommonActions();
  bindPageActions(page);
}

/* ---------- Layout ---------- */
function layout(active) {
  const nav = [
    ["dashboard", "Dashboard"],
    ["rids", "RID's"],
    ["meusrids", "Meus RIDs"],
    ["funcionarios", "Funcionários"],
    ["solicitacoes", "Solicitações"],
    ["relatorios", "Relatórios"],
    ["controle", "Centro de Controle"],
  ];

  return `
    <div class="topbar">
      <div class="brand">
        <h1>Sistema de Gerenciamento de RIDs</h1>
        <div class="sub">
          <b>${esc(currentUser.name)}</b><br/>
          ${esc(currentUser.role)}
        </div>
      </div>

      <div class="userbox">
        <div class="userinfo">
          <div class="name">${esc(currentUser.name)}</div>
          <div class="role">${esc(currentUser.role)}</div>
        </div>
        <div class="hamburger" title="Menu (visual)">
          <span></span>
        </div>
      </div>
    </div>

    <div class="navbar">
      <div class="navinner">
        ${nav
          .map(
            ([key, label]) => `
              <a class="navlink ${active === key ? "active" : ""}" href="#${key}">
                ${esc(label)}
              </a>
            `
          )
          .join("")}
      </div>
    </div>

    <div class="container">
      <div id="view"></div>
    </div>
  `;
}

function bindNav(active) {
  document.querySelectorAll(".navlink").forEach((a) => {
    a.classList.toggle("active", a.getAttribute("href") === `#${active}`);
  });
}

/* ---------- Common UI ---------- */
function bindCommonActions() {
  // nada obrigatório aqui ainda
}

/* ---------- Pages ---------- */
function pageDashboard() {
  const rids = state.rids;

  const total = rids.length;
  const andamento = rids.filter((r) => r.status === "EM ANDAMENTO").length;
  const vencido = rids.filter((r) => r.status === "VENCIDO").length;
  const corrigido = rids.filter((r) => r.status === "CORRIGIDO").length;

  const emitterCount = {};
  rids.forEach((r) => {
    emitterCount[r.emitter] = (emitterCount[r.emitter] || 0) + 1;
  });
  const top3 = Object.entries(emitterCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const last = [...rids]
    .sort((a, b) => (b.emissionDate || "").localeCompare(a.emissionDate || ""))
    .slice(0, 6);

  return `
    <div class="row" style="justify-content:space-between; margin-bottom:12px;">
      <div>
        <div class="page-title">Dashboard</div>
        <div class="page-sub">Visão geral do sistema</div>
      </div>
      <button class="btn purple" id="btnFilters">Filtros</button>
    </div>

    <div class="grid" style="margin-bottom:16px;">
      <div class="card" style="grid-column: span 3;">
        <h3>Total de RIDs</h3>
        <div class="metric">
          <div class="value">${total}</div>
          <div class="icon" style="background:#dbeafe;">≡</div>
        </div>
      </div>

      <div class="card" style="grid-column: span 3;">
        <h3>Em Andamento</h3>
        <div class="metric">
          <div class="value" style="color:var(--orange)">${andamento}</div>
          <div class="icon" style="background:#ffedd5;">⏱</div>
        </div>
      </div>

      <div class="card" style="grid-column: span 3;">
        <h3>Vencidas</h3>
        <div class="metric">
          <div class="value" style="color:var(--red)">${vencido}</div>
          <div class="icon" style="background:#fee2e2;">✖</div>
        </div>
      </div>

      <div class="card" style="grid-column: span 3;">
        <h3>Corrigidas</h3>
        <div class="metric">
          <div class="value" style="color:var(--green)">${corrigido}</div>
          <div class="icon" style="background:#dcfce7;">✔</div>
        </div>
      </div>
    </div>

    <div class="grid" style="margin-bottom:16px;">
      <div class="card" style="grid-column: span 6;">
        <div class="row" style="justify-content:space-between;align-items:flex-start">
          <div>
            <h2 style="margin:0 0 6px; font-size:18px;">Status dos RIDs</h2>
            <div class="page-sub" style="margin:0">Resumo rápido por status</div>
          </div>
          <div class="badge med">✓</div>
        </div>

        ${progressLine("EM ANDAMENTO", andamento, total, "var(--orange)")}
        ${progressLine("VENCIDO", vencido, total, "var(--red)")}
        ${progressLine("CORRIGIDO", corrigido, total, "var(--green)")}
      </div>

      <div class="card" style="grid-column: span 6;">
        <h2 style="margin:0 0 10px; font-size:18px;">Top 3 Emissores</h2>
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${
            top3.length
              ? top3
                  .map(
                    ([name, count]) => `
                      <div style="background:#f3f4f6;border-radius:14px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center;">
                        <div style="display:flex;align-items:center;gap:10px;">
                          <div style="width:26px;height:26px;border-radius:999px;background:#ffe0b2;display:grid;place-items:center;font-weight:900;">🏅</div>
                          <div style="font-weight:800">${esc(name)}</div>
                        </div>
                        <div style="font-weight:900;color:#4b7a8e">${count}</div>
                      </div>
                    `
                  )
                  .join("")
              : `<div class="page-sub">Sem dados</div>`
          }
        </div>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px;">
      <div class="row" style="justify-content:space-between;">
        <h2 style="margin:0; font-size:18px;">RIDs da Semana</h2>
        <button class="btn lightblue" id="btnNewRid">+ Novo RID</button>
      </div>
      <div class="page-sub" style="margin-top:8px">Exibindo os últimos registros</div>

      <table class="table">
        <thead class="thead">
          <tr>
            <th>Nº</th>
            <th>Emissor</th>
            <th>Descrição</th>
            <th>Setor</th>
            <th>Prioridade</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${
            last.length
              ? last
                  .map((r) => ridRow(r))
                  .join("")
              : `<tr><td colspan="7" class="page-sub">Nenhuma RID cadastrada</td></tr>`
          }
        </tbody>
      </table>
    </div>

    <div class="note">
      <b>Configurações:</b> armazenamento local (navegador). Se trocar de computador ou limpar o cache, os dados somem.
      Depois podemos ligar isso em planilha/banco.
    </div>
    <div class="footer">© Todos os direitos reservados.</div>
  `;
}

function progressLine(label, value, total, color) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return `
    <div style="margin-top:14px;">
      <div class="row" style="justify-content:space-between; margin-bottom:8px;">
        <div style="font-weight:900; font-size:12px; color:#111827">${esc(label)}</div>
        <div style="font-weight:900">${value} <span style="color:var(--muted); font-weight:700;">(${pct}%)</span></div>
      </div>
      <div style="width:100%; height:18px; border-radius:999px; background:#e5e7eb; overflow:hidden;">
        <div style="height:100%; width:${pct}%; background:${color}; border-radius:999px;"></div>
      </div>
    </div>
  `;
}

function pageRids() {
  return `
    <div class="row" style="justify-content:space-between; margin-bottom:10px;">
      <div>
        <div class="page-title">Gerenciamento de RIDs</div>
        <div class="page-sub">Filtros e lista geral</div>
      </div>
      <button class="btn green" id="btnNewRid">+ Novo RID</button>
    </div>

    <div class="card" style="margin-bottom:16px;">
      <div class="formgrid">
        <div class="col-4">
          <label class="page-sub" style="font-weight:800">Buscar</label>
          <input class="input" id="ridSearch" placeholder="RID, emissor ou local" />
        </div>

        <div class="col-4">
          <label class="page-sub" style="font-weight:800">Mês / Ano</label>
          <div class="row">
            <select id="ridMonth">
              <option value="">Mês</option>
              ${Array.from({length:12}).map((_,i)=>`<option value="${String(i+1).padStart(2,'0')}">${String(i+1).padStart(2,'0')}</option>`).join("")}
            </select>
            <input class="input" id="ridYear" placeholder="Ano" />
          </div>
        </div>

        <div class="col-4">
          <label class="page-sub" style="font-weight:800">Setor</label>
          <select id="ridSector">
            <option value="">Todos</option>
            ${unique(state.rids.map(r=>r.sector)).map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join("")}
          </select>
        </div>

        <div class="col-4">
          <label class="page-sub" style="font-weight:800">Status</label>
          <select id="ridStatus">
            <option value="">Todos</option>
            <option value="EM ANDAMENTO">EM ANDAMENTO</option>
            <option value="VENCIDO">VENCIDO</option>
            <option value="CORRIGIDO">CORRIGIDO</option>
          </select>
        </div>

        <div class="col-8" style="display:flex; gap:10px; align-items:end; justify-content:flex-end;">
          <button class="btn lightblue" id="btnApplyFilters">Aplicar</button>
          <button class="btn secondary" id="btnClearFilters">Limpar</button>
        </div>
      </div>
    </div>

    <div class="card">
      <table class="table">
        <thead class="thead">
          <tr>
            <th>UNIDADE</th>
            <th>RID Nº</th>
            <th>DATA EMISSÃO</th>
            <th>EMITENTE</th>
            <th>TIPO</th>
            <th>SETOR</th>
            <th>LOCAL</th>
            <th>GÊNESE</th>
            <th>ORIGEM</th>
            <th>DESCRIÇÃO</th>
            <th>AÇÕES</th>
          </tr>
        </thead>
        <tbody id="ridsTbody">
          ${renderRidsRows(state.rids)}
        </tbody>
      </table>
      <div class="row" style="justify-content:flex-end; margin-top:10px;">
        <button class="btn" id="btnExportRids">Exportar CSV</button>
      </div>
    </div>
  `;
}

function pageMeusRids() {
  const mine = state.rids.filter(r => (r.emitter || "").toUpperCase().includes("TESTE") || r.emitter === currentUser.name);
  return `
    <div class="page-title">Meus RIDs</div>
    <div class="page-sub">RIDs emitidas por você (por enquanto é um filtro simples)</div>

    <div class="card">
      ${
        mine.length
          ? `<table class="table">
              <thead class="thead">
                <tr>
                  <th>RID Nº</th>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                ${mine.map(r => `
                  <tr class="tr">
                    <td><span class="pill">${esc(r.number)}</span></td>
                    <td>${esc(formatDateISO(r.emissionDate))}</td>
                    <td>${esc(r.description)}</td>
                    <td>${statusBadge(r.status)}</td>
                    <td>
                      <button class="btn small secondary" data-edit="${r.id}">Editar</button>
                      <button class="btn small danger" data-del="${r.id}">Excluir</button>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>`
          : `<div class="page-sub">Você ainda não emitiu nenhuma RID.</div>`
      }
      <div class="row" style="margin-top:12px;">
        <button class="btn green" id="btnNewRid">+ Novo RID</button>
      </div>
    </div>
  `;
}

function pageFuncionarios() {
  return `
    <div class="row" style="justify-content:space-between; margin-bottom:10px;">
      <div>
        <div class="page-title">Gerenciamento de Funcionários</div>
        <div class="page-sub">Cadastro simples (localStorage)</div>
      </div>
      <button class="btn purple" id="btnNewUser">👥 Adicionar Funcionário</button>
    </div>

    <div class="card">
      <table class="table">
        <thead class="thead">
          <tr>
            <th>Nome</th>
            <th>CPF</th>
            <th>Setor</th>
            <th>Tipo</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${
            state.users.length
              ? state.users.map(u => `
                <tr class="tr">
                  <td style="font-weight:900">${esc(u.name)}</td>
                  <td>${esc(u.cpf)}</td>
                  <td>${esc(u.sector)}</td>
                  <td><span class="badge low">${esc(u.type || "Funcionário")}</span></td>
                  <td>
                    <button class="btn small danger" data-del-user="${u.id}">Excluir</button>
                  </td>
                </tr>
              `).join("")
              : `<tr><td colspan="5" class="page-sub">Sem funcionários cadastrados</td></tr>`
          }
        </tbody>
      </table>
    </div>
  `;
}

function pageSolicitacoes() {
  return `
    <div class="page-title">Solicitações Pendentes</div>
    <div class="page-sub">Estrutura pronta (você vai ligar com regras depois)</div>

    <div class="grid">
      <div class="card" style="grid-column: span 6;">
        <h2 style="margin:0 0 12px; font-size:18px;">Solicitações de remoção de RID</h2>
        <div style="background:#f3f4f6;border-radius:14px;padding:18px;text-align:center;color:var(--muted);">
          Nenhuma solicitação pendente
        </div>
      </div>

      <div class="card" style="grid-column: span 6;">
        <h2 style="margin:0 0 12px; font-size:18px;">Exclusões de Funcionários</h2>
        <div style="background:#f3f4f6;border-radius:14px;padding:18px;text-align:center;color:var(--muted);">
          Nenhuma solicitação pendente
        </div>
      </div>
    </div>
  `;
}

function pageRelatorios() {
  return `
    <div class="row" style="justify-content:space-between; margin-bottom:12px;">
      <div class="page-title">Relatório de RIDs</div>
      <button class="btn green" id="btnExportReport">⬇ Exportar Excel (CSV)</button>
    </div>

    <div class="card" style="margin-bottom:14px;">
      <div class="formgrid">
        <div class="col-4">
          <label class="page-sub" style="font-weight:800">Mês</label>
          <select id="repMonth">
            <option value="">Mês atual</option>
            ${Array.from({length:12}).map((_,i)=>`<option value="${String(i+1).padStart(2,'0')}">${String(i+1).padStart(2,'0')}</option>`).join("")}
          </select>
        </div>
        <div class="col-4">
          <label class="page-sub" style="font-weight:800">Ano</label>
          <input class="input" id="repYear" placeholder="Ex: 2026" />
        </div>
        <div class="col-4">
          <label class="page-sub" style="font-weight:800">Setor</label>
          <select id="repSector">
            <option value="">Todos</option>
            ${unique(state.rids.map(r=>r.sector)).map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join("")}
          </select>
        </div>

        <div class="col-12" style="display:flex; gap:10px; justify-content:flex-end;">
          <button class="btn lightblue" id="btnApplyReport">Aplicar</button>
          <button class="btn secondary" id="btnClearReport">Limpar</button>
        </div>
      </div>
    </div>

    <div class="card">
      <table class="table">
        <thead class="thead">
          <tr>
            <th>UNIDADE</th>
            <th>RID Nº</th>
            <th>DATA EMISSÃO</th>
            <th>EMITENTE</th>
            <th>TIPO</th>
            <th>SETOR</th>
            <th>LOCAL</th>
            <th>GÊNESE</th>
            <th>ORIGEM</th>
            <th>DESCRIÇÃO</th>
          </tr>
        </thead>
        <tbody id="reportTbody">
          ${renderReportRows(state.rids)}
        </tbody>
      </table>
    </div>
  `;
}

function pageCentroControle() {
  const rids = state.rids;
  const criticas = rids.filter(r => r.priority === "Crítico").length;
  const naoCorrigidos = rids.filter(r => r.status !== "CORRIGIDO").length;
  const semResp = rids.filter(r => !r.responsible).length;
  const removidos = 0;

  const bySector = {};
  rids.forEach(r => {
    bySector[r.sector] = (bySector[r.sector] || 0) + (["Médio","Alto","Crítico"].includes(r.priority) ? 1 : 0);
  });
  const sectorsSorted = Object.entries(bySector).sort((a,b)=>b[1]-a[1]).slice(0,7);

  return `
    <div class="row" style="justify-content:space-between; margin-bottom:12px;">
      <div class="page-title">Centro de Controle</div>
      <div class="row">
        <button class="btn purple" id="btnFilters2">Filtros</button>
        <button class="btn lightblue" id="btnGenReport">Gerar Relatório</button>
      </div>
    </div>

    <div class="grid" style="margin-bottom:16px;">
      <div class="card" style="grid-column: span 6; background:#ffe3e3;">
        <h3 style="color:#991b1b">RIDs Críticas</h3>
        <div class="metric"><div class="value" style="color:#991b1b">${criticas}</div></div>
      </div>
      <div class="card" style="grid-column: span 6; background:#ffeccf;">
        <h3 style="color:#7c2d12">RIDs Ainda Não Corrigidos</h3>
        <div class="metric"><div class="value" style="color:#7c2d12">${naoCorrigidos}</div></div>
      </div>

      <div class="card" style="grid-column: span 6; background:#fff7c7;">
        <h3 style="color:#7c5a00">Sem Responsável</h3>
        <div class="metric"><div class="value" style="color:#7c5a00">${semResp}</div></div>
      </div>
      <div class="card" style="grid-column: span 6; background:#e9edf2;">
        <h3>RIDs Removidos</h3>
        <div class="metric"><div class="value">${removidos}</div></div>
      </div>
    </div>

    <div class="grid">
      <div class="card" style="grid-column: span 6;">
        <h2 style="margin:0 0 10px; font-size:18px;">Distribuição de Risco (simples)</h2>
        <div class="page-sub">Por enquanto, uma visão textual. Depois colocamos gráfico real.</div>
        <div style="margin-top:10px; display:flex; flex-direction:column; gap:8px;">
          ${riskLine("Crítico", rids.filter(r=>r.priority==="Crítico").length, "var(--red)")}
          ${riskLine("Alto", rids.filter(r=>r.priority==="Alto").length, "var(--orange)")}
          ${riskLine("Médio", rids.filter(r=>r.priority==="Médio").length, "var(--green)")}
        </div>
      </div>

      <div class="card" style="grid-column: span 6;">
        <h2 style="margin:0 0 10px; font-size:18px;">Setores com mais RIDs Médio, Alto e Crítico</h2>
        <div style="margin-top:6px; display:flex; flex-direction:column; gap:10px;">
          ${
            sectorsSorted.length
              ? sectorsSorted.map(([sector, count]) => `
                <div>
                  <div class="row" style="justify-content:space-between; margin-bottom:6px;">
                    <div style="font-weight:900">${esc(sector || "SEM SETOR")}</div>
                    <div style="font-weight:900">${count}</div>
                  </div>
                  <div style="height:8px; background:#e5e7eb; border-radius:999px; overflow:hidden;">
                    <div style="height:8px; width:${Math.min(100, count*8)}%; background:#ef4444; border-radius:999px;"></div>
                  </div>
                </div>
              `).join("")
              : `<div class="page-sub">Sem dados</div>`
          }
        </div>
      </div>
    </div>
  `;
}

function riskLine(label, count, color){
  const total = state.rids.length || 1;
  const pct = Math.round((count/total)*100);
  return `
    <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
      <div class="badge" style="background:rgba(0,0,0,.05); color:#111827;">
        <span style="width:10px;height:10px;border-radius:999px;background:${color};display:inline-block;"></span>
        ${esc(label)}
      </div>
      <div style="font-weight:900">${count} <span style="color:var(--muted); font-weight:700;">(${pct}%)</span></div>
    </div>
  `;
}

/* ---------- Rows / Badges ---------- */
function statusBadge(status){
  const s = (status || "").toUpperCase();
  if (s === "EM ANDAMENTO") return `<span class="badge status-progress">EM ANDAMENTO</span>`;
  if (s === "VENCIDO") return `<span class="badge status-overdue">VENCIDO</span>`;
  if (s === "CORRIGIDO") return `<span class="badge status-fixed">CORRIGIDO</span>`;
  return `<span class="badge status-open">${esc(s || "ABERTO")}</span>`;
}
function priorityBadge(p){
  const v = (p || "Baixo").toLowerCase();
  if (v.includes("cr")) return `<span class="badge crit">Crítico</span>`;
  if (v.includes("al")) return `<span class="badge high">Alto</span>`;
  if (v.includes("mé") || v.includes("me")) return `<span class="badge med">Médio</span>`;
  return `<span class="badge low">Baixo</span>`;
}

function ridRow(r){
  return `
    <tr class="tr">
      <td><span class="pill">${esc(r.number)}</span></td>
      <td style="font-weight:900">${esc(r.emitter)}</td>
      <td>${esc(r.description)}</td>
      <td>${esc(r.sector)}</td>
      <td>${priorityBadge(r.priority)}</td>
      <td>${statusBadge(r.status)}</td>
      <td>
        <button class="btn small secondary" data-edit="${r.id}">Editar</button>
        <button class="btn small danger" data-del="${r.id}">Excluir</button>
      </td>
    </tr>
  `;
}

function renderRidsRows(list){
  if (!list.length) return `<tr><td colspan="11" class="page-sub">Nenhuma RID encontrada</td></tr>`;
  return list.map(r => `
    <tr class="tr">
      <td>${esc(currentUser.unit)}</td>
      <td><span class="pill">${esc(r.number)}</span></td>
      <td>${esc(formatDateISO(r.emissionDate))}</td>
      <td style="font-weight:900">${esc(r.emitter)}</td>
      <td>${esc(r.type)}</td>
      <td>${esc(r.sector)}</td>
      <td>${esc(r.local)}</td>
      <td>${esc(r.genesis)}</td>
      <td>${esc(r.origin)}</td>
      <td>${esc(r.description)}</td>
      <td>
        <button class="btn small secondary" data-edit="${r.id}">Editar</button>
        <button class="btn small danger" data-del="${r.id}">Excluir</button>
      </td>
    </tr>
  `).join("");
}

function renderReportRows(list){
  if (!list.length) return `<tr><td colspan="10" class="page-sub">Sem dados para exibir</td></tr>`;
  return list.map(r => `
    <tr class="tr">
      <td>${esc(currentUser.unit)}</td>
      <td style="font-weight:900">${esc(r.number)}</td>
      <td>${esc(formatDateISO(r.emissionDate))}</td>
      <td>${esc(r.emitter)}</td>
      <td>${esc(r.type)}</td>
      <td>${esc(r.sector)}</td>
      <td>${esc(r.local)}</td>
      <td>${esc(r.genesis)}</td>
      <td>${esc(r.origin)}</td>
      <td>${esc(r.description)}</td>
    </tr>
  `).join("");
}

function unique(arr){
  return [...new Set(arr.filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),'pt-BR'));
}

/* ---------- Binds by page ---------- */
function bindPageActions(page){
  // botões comuns (novo rid) existem em várias telas
  const btnNew = $("#btnNewRid");
  if (btnNew) btnNew.addEventListener("click", () => openRidModal());

  // Delegação para edit/del rid
  document.body.addEventListener("click", onBodyClickOnce, { once:true });
  function onBodyClickOnce(){
    document.body.addEventListener("click", onBodyClick);
  }
  function onBodyClick(e){
    const editId = e.target?.getAttribute?.("data-edit");
    const delId  = e.target?.getAttribute?.("data-del");
    const delUser = e.target?.getAttribute?.("data-del-user");

    if (editId){
      const rid = state.rids.find(r => r.id === editId);
      if (rid) openRidModal(rid);
    }
    if (delId
