(() => {
  const STORAGE_KEY = "rid_privado_rids_v1";

  // ---------- Helpers ----------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const todayISO = () => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mm}-${dd}`;
  };

  const safeText = (v) => (v ?? "").toString().trim();

  const load = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const save = (list) => localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

  const norm = (s) =>
    safeText(s)
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");

  const badgeStatus = (s) => {
    if (s === "Concluído") return `<span class="badge green">${s}</span>`;
    if (s === "Em andamento") return `<span class="badge yellow">${s}</span>`;
    return `<span class="badge blue">${s}</span>`;
  };

  const badgePrio = (p) => {
    if (p === "Crítica") return `<span class="badge red">${p}</span>`;
    if (p === "Alta") return `<span class="badge yellow">${p}</span>`;
    if (p === "Média") return `<span class="badge blue">${p}</span>`;
    return `<span class="badge">${p}</span>`;
  };

  const toBR = (iso) => {
    if (!iso) return "";
    // iso yyyy-mm-dd
    const [y, m, d] = iso.split("-");
    if (!y || !m || !d) return iso;
    return `${d}/${m}/${y}`;
  };

  // ---------- State ----------
  let rids = load();
  let editingId = null;

  // ---------- Tabs / Views ----------
  const setView = (view) => {
    $$(".tab").forEach((b) => b.classList.toggle("is-active", b.dataset.view === view));
    $$(".view").forEach((v) => v.classList.toggle("is-active", v.id === `view-${view}`));
  };

  $$(".tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      setView(btn.dataset.view);
      renderAll();
    });
  });

  // ---------- Modal ----------
  const modal = $("#modal");
  const openModal = (mode, rid = null) => {
    $("#mErro").style.display = "none";
    $("#mErro").textContent = "";

    editingId = rid ? rid.id : null;

    $("#modalTitle").textContent = mode === "edit" ? "Editar RID" : "Novo RID";
    $("#modalHint").textContent = mode === "edit" ? "Edite e salve as alterações." : "Preencha os campos e salve.";

    $("#mNumero").value = rid ? rid.numero : "";
    $("#mData").value = rid ? rid.dataISO : todayISO();
    $("#mTitulo").value = rid ? rid.titulo : "";
    $("#mStatus").value = rid ? rid.status : "Aberto";
    $("#mPrioridade").value = rid ? rid.prioridade : "Baixa";
    $("#mSolicitante").value = rid ? rid.solicitante : "";
    $("#mDescricao").value = rid ? (rid.descricao || "") : "";

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    $("#mNumero").focus();
  };

  const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    editingId = null;
  };

  $("#btnFecharModal").addEventListener("click", closeModal);
  $("#btnCancelar").addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  $("#btnNovoRid").addEventListener("click", () => openModal("new"));
  $("#btnNovoRid2").addEventListener("click", () => openModal("new"));

  // ---------- CRUD ----------
  const upsertRid = () => {
    const numero = safeText($("#mNumero").value);
    const dataISO = safeText($("#mData").value);
    const titulo = safeText($("#mTitulo").value);
    const status = $("#mStatus").value;
    const prioridade = $("#mPrioridade").value;
    const solicitante = safeText($("#mSolicitante").value);
    const descricao = safeText($("#mDescricao").value);

    const err = (msg) => {
      $("#mErro").textContent = msg;
      $("#mErro").style.display = "block";
    };

    if (!numero) return err("Informe o número do RID.");
    if (!/^\d+$/g.test(numero)) return err("O número deve conter apenas dígitos (ex: 1024).");
    if (!dataISO) return err("Informe a data.");
    if (!titulo) return err("Informe o título.");
    if (!solicitante) return err("Informe o solicitante.");

    // impedir duplicado (se criando)
    const exists = rids.some((r) => r.numero === numero && r.id !== editingId);
    if (exists) return err("Já existe um RID com esse número.");

    if (editingId) {
      rids = rids.map((r) =>
        r.id === editingId
          ? { ...r, numero, dataISO, titulo, status, prioridade, solicitante, descricao, updatedAt: Date.now() }
          : r
      );
    } else {
      const rid = {
        id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()) + "_" + Math.random().toString(16).slice(2),
        numero,
        dataISO,
        titulo,
        status,
        prioridade,
        solicitante,
        descricao,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      rids.unshift(rid);
    }

    save(rids);
    closeModal();
    renderAll();
  };

  $("#btnSalvar").addEventListener("click", upsertRid);

  const delRid = (id) => {
    const rid = rids.find((r) => r.id === id);
    const ok = confirm(`Excluir o RID ${rid?.numero || ""}?`);
    if (!ok) return;
    rids = rids.filter((r) => r.id !== id);
    save(rids);
    renderAll();
  };

  const toggleConcluir = (id) => {
    rids = rids.map((r) => {
      if (r.id !== id) return r;
      const next = r.status === "Concluído" ? "Aberto" : "Concluído";
      return { ...r, status: next, updatedAt: Date.now() };
    });
    save(rids);
    renderAll();
  };

  // ---------- Filters / Search ----------
  const applyFilters = (list, query, status, prioridade) => {
    let out = [...list];

    if (query) {
      const q = norm(query);
      out = out.filter((r) => {
        const hay = norm(`${r.numero} ${r.titulo} ${r.solicitante} ${r.status} ${r.prioridade} ${r.descricao || ""}`);
        return hay.includes(q);
      });
    }

    if (status) out = out.filter((r) => r.status === status);
    if (prioridade) out = out.filter((r) => r.prioridade === prioridade);

    return out;
  };

  // ---------- Rendering ----------
  const rowHTML = (r) => `
    <tr>
      <td>${r.numero}</td>
      <td>${escapeHTML(r.titulo)}</td>
      <td>${badgeStatus(r.status)}</td>
      <td>${badgePrio(r.prioridade)}</td>
      <td>${escapeHTML(r.solicitante)}</td>
      <td>${toBR(r.dataISO)}</td>
      <td class="right">
        <div class="actions">
          <button class="smallBtn" data-act="edit" data-id="${r.id}">Editar</button>
          <button class="smallBtn" data-act="done" data-id="${r.id}">${r.status === "Concluído" ? "Reabrir" : "Concluir"}</button>
          <button class="smallBtn danger" data-act="del" data-id="${r.id}">Excluir</button>
        </div>
      </td>
    </tr>
  `;

  function escapeHTML(s){
    return safeText(s)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  const bindTableActions = (tableEl) => {
    tableEl.querySelectorAll("button[data-act]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const act = btn.dataset.act;
        const rid = rids.find((x) => x.id === id);

        if (act === "edit") return openModal("edit", rid);
        if (act === "done") return toggleConcluir(id);
        if (act === "del") return delRid(id);
      });
    });
  };

  const renderKPIs = () => {
    const total = rids.length;
    const abertos = rids.filter((r) => r.status === "Aberto").length;
    const andamento = rids.filter((r) => r.status === "Em andamento").length;
    const concluidos = rids.filter((r) => r.status === "Concluído").length;

    $("#kpiTotal").textContent = total;
    $("#kpiAbertos").textContent = abertos;
    $("#kpiAndamento").textContent = andamento;
    $("#kpiConcluidos").textContent = concluidos;
  };

  const renderTables = () => {
    const qDash = safeText($("#globalSearch").value);
    const status = $("#fStatus").value;
    const prio = $("#fPrioridade").value;

    const filtered = applyFilters(rids, qDash, status, prio);

    // principais
    const tb = $("#tblRids tbody");
    tb.innerHTML = filtered.map(rowHTML).join("") || `<tr><td colspan="7" class="muted">Nenhum RID encontrado.</td></tr>`;
    bindTableActions(tb);

    // ultimos (top 6)
    const tbu = $("#tblUltimos tbody");
    const last = filtered.slice(0, 6);
    tbu.innerHTML = last.map(rowHTML).join("") || `<tr><td colspan="7" class="muted">Nenhum RID cadastrado.</td></tr>`;
    bindTableActions(tbu);

    // tabela da aba RIDs
    const q2 = safeText($("#ridsSearch").value);
    const filtered2 = applyFilters(rids, q2, "", "");
    const tb2 = $("#tblRids2 tbody");
    tb2.innerHTML = filtered2.map(rowHTML).join("") || `<tr><td colspan="7" class="muted">Nenhum RID encontrado.</td></tr>`;
    bindTableActions(tb2);
  };

  const countBy = (keyFn) => {
    const map = new Map();
    for (const r of rids) {
      const k = keyFn(r);
      map.set(k, (map.get(k) || 0) + 1);
    }
    return [...map.entries()].sort((a,b) => b[1]-a[1]);
  };

  const renderReports = () => {
    const byStatus = countBy((r) => r.status);
    const byPrio = countBy((r) => r.prioridade);

    $("#repStatus").innerHTML =
      byStatus.map(([k,v]) => `<div class="repItem"><strong>${k}</strong><span>${v}</span></div>`).join("") ||
      `<div class="muted">Sem dados</div>`;

    $("#repPrioridade").innerHTML =
      byPrio.map(([k,v]) => `<div class="repItem"><strong>${k}</strong><span>${v}</span></div>`).join("") ||
      `<div class="muted">Sem dados</div>`;
  };

  const renderAll = () => {
    renderKPIs();
    renderTables();
    renderReports();
  };

  // ---------- CSV ----------
  const exportCSV = () => {
    const status = $("#fStatus").value;
    const prio = $("#fPrioridade").value;
    const q = safeText($("#globalSearch").value);

    const list = applyFilters(rids, q, status, prio);

    const header = ["numero","data","titulo","status","prioridade","solicitante","descricao"];
    const rows = list.map(r => [
      r.numero,
      toBR(r.dataISO),
      r.titulo,
      r.status,
      r.prioridade,
      r.solicitante,
      r.descricao || ""
    ]);

    const csv = [header, ...rows]
      .map(cols => cols.map(c => `"${safeText(c).replaceAll('"','""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `rids_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  $("#btnExportar").addEventListener("click", exportCSV);

  // ---------- Config buttons ----------
  $("#btnApagarTudo").addEventListener("click", () => {
    const ok = confirm("Tem certeza que deseja apagar TODOS os RIDs?");
    if (!ok) return;
    rids = [];
    save(rids);
    renderAll();
    alert("RIDs apagados.");
  });

  $("#btnCriarExemplos").addEventListener("click", () => {
    const examples = [
      { numero:"1001", dataISO: todayISO(), titulo:"Ajuste de processo", status:"Aberto", prioridade:"Média", solicitante:"João", descricao:"Revisar fluxo do atendimento." },
      { numero:"1002", dataISO: todayISO(), titulo:"Erro em relatório", status:"Em andamento", prioridade:"Alta", solicitante:"Maria", descricao:"Relatório mensal com divergência." },
      { numero:"1003", dataISO: todayISO(), titulo:"Atualização de template", status:"Concluído", prioridade:"Baixa", solicitante:"Carlos", descricao:"Padronizar cabeçalhos." },
    ].map(x => ({
      id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()) + "_" + Math.random().toString(16).slice(2),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...x
    }));

    // não duplicar número se já existir
    const existingNums = new Set(rids.map(r => r.numero));
    const toAdd = examples.filter(e => !existingNums.has(e.numero));

    rids = [...toAdd, ...rids];
    save(rids);
    renderAll();
    alert("Exemplos criados.");
  });

  // ---------- Inputs triggers ----------
  $("#globalSearch").addEventListener("input", renderAll);
  $("#fStatus").addEventListener("change", renderAll);
  $("#fPrioridade").addEventListener("change", renderAll);
  $("#ridsSearch").addEventListener("input", renderAll);

  // ---------- Boot ----------
  // se estiver vazio, já renderiza mesmo assim
  renderAll();
})();
