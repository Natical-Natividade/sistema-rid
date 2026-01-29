const app = document.getElementById("app");

// ======================
// DASHBOARD
// ======================
function showDashboard() {
  app.innerHTML = `
    <h2 class="text-2xl font-bold text-blue-400 mb-4">Dashboard</h2>
    <p class="mb-4">Visão geral do sistema</p>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="card">Total de RIDs<br><strong>0</strong></div>
      <div class="card">Abertos<br><strong>0</strong></div>
      <div class="card">Em andamento<br><strong>0</strong></div>
      <div class="card">Concluídos<br><strong>0</strong></div>
    </div>
  `;
}

// ======================
// RIDS
// ======================
function showRIDs() {
  app.innerHTML = `
    <h2 class="text-2xl font-bold text-blue-400 mb-4">Lista de RIDs</h2>

    <div class="card mb-4">
      <input placeholder="Buscar RID, título, solicitante" class="w-full">
    </div>

    <button class="btn mb-4" onclick="showNovoRID()">+ Novo RID</button>

    <table class="w-full text-sm border border-slate-700">
      <thead class="bg-slate-800">
        <tr>
          <th class="p-2">Nº</th>
          <th>Título</th>
          <th>Status</th>
          <th>Prioridade</th>
          <th>Solicitante</th>
          <th>Data</th>
        </tr>
      </thead>
      <tbody>
        <tr class="border-t border-slate-700">
          <td class="p-2 text-center">—</td>
          <td colspan="5" class="text-center text-slate-400">Nenhum RID cadastrado</td>
        </tr>
      </tbody>
    </table>
  `;
}

// ======================
// NOVO RID
// ======================
function showNovoRID() {
  app.innerHTML = `
    <h2 class="text-2xl font-bold text-blue-400 mb-4">Novo RID</h2>

    <div class="card space-y-3 max-w-md">
      <input placeholder="Número do RID">
      <input type="date">
      <input placeholder="Título">
      <select>
        <option>Aberto</option>
        <option>Em andamento</option>
        <option>Concluído</option>
      </select>
      <select>
        <option>Baixa</option>
        <option>Média</option>
        <option>Alta</option>
      </select>
      <input placeholder="Solicitante">

      <div class="flex gap-2">
        <button class="btn" onclick="showRIDs()">Cancelar</button>
        <button class="btn bg-blue-600">Salvar</button>
      </div>
    </div>
  `;
}

// ======================
// RELATÓRIOS
// ======================
function showRelatorios() {
  app.innerHTML = `
    <h2 class="text-2xl font-bold text-blue-400 mb-4">Relatórios</h2>
    <div class="card">
      <p>Resumo por status</p>
      <p>Resumo por prioridade</p>
      <button class="btn mt-2">Exportar CSV</button>
    </div>
  `;
}

// ======================
// CONFIG
// ======================
function showConfig() {
  app.innerHTML = `
    <h2 class="text-2xl font-bold text-blue-400 mb-4">Configurações</h2>

    <div class="card space-y-2">
      <p>Armazenamento local (localStorage)</p>
      <button class="btn">Apagar todos os RIDs</button>
      <button class="btn">Criar exemplos</button>
    </div>
  `;
}

// ======================
// START
// ======================
showDashboard();
