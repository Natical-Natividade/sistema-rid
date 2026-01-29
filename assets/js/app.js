const app = document.getElementById("app");

/* ======================
   DASHBOARD
====================== */
function showDashboard() {
  app.innerHTML = `
    <h2 class="text-4xl font-bold text-blue-500 mb-2">Dashboard</h2>
    <p class="text-slate-400 mb-6">Visão geral do sistema</p>

    <div class="flex gap-4 mb-6">
      <input class="input w-72" placeholder="Buscar RID, título, solicitante">
      <button class="btn">+ Novo RID</button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div class="card">Total de RIDs<br><strong class="text-2xl">0</strong></div>
      <div class="card">Abertos<br><strong class="text-2xl">0</strong></div>
      <div class="card">Em andamento<br><strong class="text-2xl">0</strong></div>
      <div class="card">Concluídos<br><strong class="text-2xl">0</strong></div>
    </div>

    <h3 class="text-xl font-semibold mb-2">Últimos RIDs</h3>
    <table class="table">
      <thead>
        <tr>
          <th>Nº</th>
          <th>Título</th>
          <th>Status</th>
          <th>Prioridade</th>
          <th>Solicitante</th>
          <th>Data</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td colspan="7" class="text-center text-slate-500">
            Nenhum RID cadastrado
          </td>
        </tr>
      </tbody>
    </table>
  `;
}

/* ======================
   RIDS
====================== */
function showRIDs() {
  app.innerHTML = `
    <h2 class="text-3xl font-bold text-blue-500 mb-4">Lista de RIDs</h2>

    <div class="flex gap-4 mb-4">
      <select class="input">
        <option>Todos</option>
      </select>
      <select class="input">
        <option>Todas</option>
      </select>
      <button class="btn">Exportar CSV</button>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>Nº</th>
          <th>Título</th>
          <th>Status</th>
          <th>Prioridade</th>
          <th>Solicitante</th>
          <th>Data</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td colspan="7" class="text-center text-slate-500">
            Nenhum RID encontrado
          </td>
        </tr>
      </tbody>
    </table>
  `;
}

/* ======================
   RELATÓRIOS
====================== */
function showRelatorios() {
  app.innerHTML = `
    <h2 class="text-3xl font-bold text-blue-500 mb-4">Relatórios</h2>

    <div class="card mb-4">
      <p>Resumo por status</p>
    </div>

    <div class="card">
      <p>Resumo por prioridade</p>
    </div>
  `;
}

/* ======================
   CONFIG
====================== */
function showConfig() {
  app.innerHTML = `
    <h2 class="text-3xl font-bold text-blue-500 mb-4">Configurações</h2>

    <div class="card space-y-3">
      <p>
        Armazenamento local (localStorage).  
        Se trocar de computador ou limpar cache, os dados somem.
      </p>

      <div class="flex gap-2">
        <button class="btn">Apagar todos os RIDs</button>
        <button class="btn">Criar exemplos</button>
      </div>
    </div>

    <p class="text-sm text-slate-500 mt-6">
      © Todos os direitos reservados.
    </p>
  `;
}

/* ======================
   START
====================== */
showDashboard();
