// src/dashboard.js

// ===== Estado e persistência (dashboard) =====
var dadosCompeticao = {}; // { nome, local, data, descricao }
var robos = {};           // { nomeRobo: { equipe, classe, peso, descricao, fotoBase64, pontos } }

function salvarCompeticao() {
  localStorage.setItem("competicao", JSON.stringify(dadosCompeticao));
}
function carregarCompeticao() {
  const d = localStorage.getItem("competicao");
  if (d) dadosCompeticao = JSON.parse(d);
}

function salvarRobos() {
  localStorage.setItem("robos", JSON.stringify(robos));
}
function carregarRobos() {
  const d = localStorage.getItem("robos");
  if (d) robos = JSON.parse(d);
}

// ===== Utilitários locais =====
function limparContent() {
  const el = document.getElementById("content");
  if (el) el.innerHTML = "";
}
function criarTitulo(texto) {
  const h = document.createElement("h3");
  h.textContent = texto;
  return h;
}

// Limpa formulário de robô (utilitário)
function limparFormularioRobo(){
  const el = id => document.getElementById(id);
  if (el("roboNome")) el("roboNome").value = "";
  if (el("roboEquipe")) el("roboEquipe").value = "";
  if (el("roboClasse")) el("roboClasse").value = "";
  if (el("roboPeso")) el("roboPeso").value = "";
  if (el("roboDesc")) el("roboDesc").value = "";
  if (el("roboFoto")) el("roboFoto").value = "";
}

// ===== Dashboard: competição + robôs (CRUD) =====
function mostrarDashboard(){
  limparContent();
  carregarCompeticao(); // mantém dados em memória, mas NÃO preenche os inputs (ficam vazios)
  carregarRobos();

  const content = document.getElementById("content");
  if (!content) return;

  // Competição (inputs intencionalmente deixados em branco)
  const secCompeticao = document.createElement("section");
  secCompeticao.appendChild(criarTitulo("Informações da competição"));
  const formCompeticao = document.createElement("div");
  formCompeticao.innerHTML = `
    <label>Nome:</label><input type="text" id="compNome" value=""><br>
    <label>Local:</label><input type="text" id="compLocal" value=""><br>
    <label>Data:</label><input type="date" id="compData" value=""><br>
    <label>Descrição:</label><textarea id="compDesc"></textarea><br>
    <button id="btnSalvarCompeticao">Salvar competição</button>
  `;
  secCompeticao.appendChild(formCompeticao);

  // Cadastro de robô
  const secRobo = document.createElement("section");
  secRobo.appendChild(criarTitulo("Cadastro de robô"));
  const formRobo = document.createElement("div");
  formRobo.innerHTML = `
    <label>Nome do robô:</label><input type="text" id="roboNome"><br>
    <label>Equipe:</label><input type="text" id="roboEquipe"><br>
    <label>Classe:</label><input type="text" id="roboClasse"><br>
    <label>Peso (g):</label><input type="number" id="roboPeso"><br>
    <label>Descrição:</label><textarea id="roboDesc"></textarea><br>
    <label>Foto:</label><input type="file" id="roboFoto" accept="image/*"><br>
    <button id="btnSalvarRobo">Salvar robô</button>
    <button id="btnNovoRobo" style="margin-left:8px;">Novo robô</button>
  `;
  secRobo.appendChild(formRobo);

  // Lista de robôs
  const secListaRobos = document.createElement("section");
  secListaRobos.appendChild(criarTitulo("Robôs cadastrados"));
  const tabelaRobos = document.createElement("table");
  tabelaRobos.className = "lista-table";
  tabelaRobos.innerHTML = `<thead><tr><th>Nome</th><th>Equipe</th><th>Classe</th><th>Peso</th><th>Descrição</th><th>Foto</th><th>Pontos</th><th>Ações</th></tr></thead>`;
  const tbodyRobos = document.createElement("tbody");
  tabelaRobos.appendChild(tbodyRobos);
  secListaRobos.appendChild(tabelaRobos);

  // Preenche a tabela de robôs
  Object.entries(robos).forEach(([nome, dados])=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${nome}</td>
      <td>${dados.equipe||""}</td>
      <td>${dados.classe||""}</td>
      <td>${dados.peso ? `${dados.peso} g` : "—"}</td>
      <td>${dados.descricao||""}</td>
      <td>${dados.fotoBase64 ? `<img src="${dados.fotoBase64}" style="max-width:80px; border-radius:6px;">` : "—"}</td>
      <td>${dados.pontos || 0}</td>
      <td></td>
    `;
    const tdAcoes = tr.querySelector("td:last-child");

    // Botão Editar (preenche formulário para edição)
    const btnEditar = document.createElement("button");
    btnEditar.textContent = "Editar";
    btnEditar.className = "btn-edit";
    btnEditar.onclick = () => {
      if (document.getElementById("roboNome")) document.getElementById("roboNome").value = nome;
      if (document.getElementById("roboEquipe")) document.getElementById("roboEquipe").value = dados.equipe||"";
      if (document.getElementById("roboClasse")) document.getElementById("roboClasse").value = dados.classe||"";
      if (document.getElementById("roboPeso")) document.getElementById("roboPeso").value = dados.peso||"";
      if (document.getElementById("roboDesc")) document.getElementById("roboDesc").value = dados.descricao||"";
    };

    // Botão Excluir
    const btnExcluir = document.createElement("button");
    btnExcluir.textContent = "Excluir";
    btnExcluir.className = "btn-danger";
    btnExcluir.onclick = () => {
      if (confirm(`Deseja excluir o robô ${nome}?`)) {
        delete robos[nome];
        salvarRobos();
        mostrarDashboard();
      }
    };

    tdAcoes.appendChild(btnEditar);
    tdAcoes.appendChild(btnExcluir);
    tbodyRobos.appendChild(tr);
  });

  // Adiciona seções ao content
  content.appendChild(secCompeticao);
  content.appendChild(secRobo);
  content.appendChild(secListaRobos);

  // Evento: salvar competição (salva e limpa campos)
  const btnSalvarComp = document.getElementById("btnSalvarCompeticao");
  if (btnSalvarComp) {
    btnSalvarComp.onclick = () => {
      // salva os dados na variável e em localStorage
      dadosCompeticao = {
        nome: document.getElementById("compNome").value,
        local: document.getElementById("compLocal").value,
        data: document.getElementById("compData").value,
        descricao: document.getElementById("compDesc").value
      };
      salvarCompeticao();

      // limpa os campos do formulário (permanece em branco mesmo ao reabrir o dashboard)
      document.getElementById("compNome").value = "";
      document.getElementById("compLocal").value = "";
      document.getElementById("compData").value = "";
      document.getElementById("compDesc").value = "";

      alert("Competição salva!");
    };
  }

  // Evento: salvar robô (criar/atualizar)
  const btnSalvarRobo = document.getElementById("btnSalvarRobo");
  if (btnSalvarRobo) {
    btnSalvarRobo.onclick = () => {
      const nome = document.getElementById("roboNome").value.trim();
      if (!nome) return alert("Nome do robô não pode ser vazio.");
      const equipe = document.getElementById("roboEquipe").value;
      const classe = document.getElementById("roboClasse").value;
      const peso = document.getElementById("roboPeso").value;
      const desc = document.getElementById("roboDesc").value;
      const fotoInput = document.getElementById("roboFoto");

      const salvarDados = (fotoBase64) => {
        const pontosExistentes = robos[nome]?.pontos || 0;
        robos[nome] = { equipe, classe, peso, descricao: desc, fotoBase64, pontos: pontosExistentes };
        salvarRobos();
        mostrarDashboard();
        limparFormularioRobo();
      };

      if (fotoInput && fotoInput.files && fotoInput.files[0]) {
        const reader = new FileReader();
        reader.onload = e => salvarDados(e.target.result);
        reader.readAsDataURL(fotoInput.files[0]);
      } else {
        salvarDados(robos[nome]?.fotoBase64 || null);
      }
    };
  }

  // Botão novo robô
  const btnNovo = document.getElementById("btnNovoRobo");
  if (btnNovo) btnNovo.onclick = () => limparFormularioRobo();
}

// Nota: este arquivo define globals (dadosCompeticao, robos, salvarRobos, carregarRobos, mostrarDashboard, etc.)
// para que outros scripts (p.ex. main.js) possam usar quando dashboard.js for carregado antes deles.
