// =====================
// Firebase
// =====================
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_AUTH_DOMAIN",
  projectId: "SEU_PROJECT_ID",
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// =====================
// Render helper
// =====================
const app = document.getElementById("app");

function render(html) {
  app.innerHTML = html;
}

// =====================
// Telas
// =====================
function renderHome() {
  render(`
    <h1 class="text-3xl font-bold text-blue-400">Sistema RID</h1>
    <p class="mt-2">Site funcionando corretamente 🎉</p>

    <button onclick="renderDashboard()"
      class="mt-6 px-4 py-2 bg-blue-600 rounded">
      Ir para Dashboard
    </button>
  `);
}

function renderDashboard() {
  render(`
    <h2 class="text-2xl font-bold mb-4">Dashboard</h2>

    <ul class="space-y-2">
      <li>📌 Total de RIDs: 0</li>
      <li>⏳ Em andamento: 0</li>
      <li>✅ Concluídos: 0</li>
    </ul>

    <button onclick="renderHome()"
      class="mt-6 px-4 py-2 bg-gray-700 rounded">
      Voltar
    </button>
  `);
}

// =====================
// Inicialização
// =====================
document.addEventListener("DOMContentLoaded", () => {
  renderHome();
});
