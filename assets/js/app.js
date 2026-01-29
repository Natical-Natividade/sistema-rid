document.addEventListener("DOMContentLoaded", () => {
  const app = document.getElementById("app");
  if (!app) {
    document.body.innerHTML = "<h1 style='color:white'>ERRO: #app não existe</h1>";
    return;
  }

  app.innerHTML = `
    <h1 style="color:#60a5fa; font-size:32px; font-weight:700">Sistema RID</h1>
    <p style="margin-top:10px">✅ JS carregou e renderizou.</p>
  `;
});
