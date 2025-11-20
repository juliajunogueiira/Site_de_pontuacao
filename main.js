// main.js
// Contém: estado global mínimo, tabela de dano, combate, tabela visual, ranking, inicialização menu, e lógica de checklist.
// Depende de functions exported implicitly by dashboard.js (dadosCompeticao, robos, salvarRobos, carregarRobos, mostrarDashboard etc.)

// OBS: dashboard.js define dadosCompeticao e robos no escopo global (como já era antes),
//      então main.js pode usar essas variáveis diretamente.

// --- Variáveis Globais e Configuração ---

const tabela_dano = {
  "Trivial":       {"Trivial":[9,9],"Cosmético":[10,8],"Menor":[12,6],"Significativo":[14,4],"Maior":[16,2],"Massivo":[18,0]},
  "Cosmético":     {"Trivial":[8,10],"Cosmético":[9,9],"Menor":[10,8],"Significativo":[12,6],"Maior":[14,4],"Massivo":[17,1]},
  "Menor":         {"Trivial":[6,12],"Cosmético":[8,10],"Menor":[9,9],"Significativo":[11,7],"Maior":[13,5],"Massivo":[15,3]},
  "Significativo":{"Trivial":[4,14],"Cosmético":[6,12],"Menor":[7,11],"Significativo":[9,9],"Maior":[11,7],"Massivo":[13,5]},
  "Maior":         {"Trivial":[2,16],"Cosmético":[4,14],"Menor":[5,13],"Significativo":[7,11],"Maior":[9,9],"Massivo":[11,7]},
  "Massivo":       {"Trivial":[0,18],"Cosmético":[1,17],"Menor":[3,15],"Significativo":[5,13],"Maior":[7,11],"Massivo":[9,9]}
};
const niveis = Object.keys(tabela_dano);
let combateAtivo = false;

// --- Variáveis e Funções da Checklist (Movidas para o Escopo Global) ---

// Carregar ou inicializar itens do LocalStorage
let itens = JSON.parse(localStorage.getItem("checklistItens")) || [
  {titulo:"Estrutura", descricao:"Verificar integridade da estrutura", tipo:"estatica"},
  {titulo:"Sistema elétrico", descricao:"Checar fiação e conexões", tipo:"estatica"},
  {titulo:"Segurança", descricao:"Avaliar dispositivos de segurança", tipo:"dinamica"}
];

function salvarItens() {
  localStorage.setItem("checklistItens", JSON.stringify(itens));
}

// Renderizar lista de administração
function renderAdmin() {
  const lista = document.getElementById("listaAdmin");
  if (!lista) return;
  lista.innerHTML = "";
  itens.forEach((item, index) => {
    const li = document.createElement("li");
    li.textContent = `${item.titulo} (${item.tipo}) | ${item.descricao}`;
    const btnDel = document.createElement("button");
    btnDel.textContent = "Remover";
    btnDel.className = "btn danger";
    btnDel.style.marginLeft = "10px";
    btnDel.onclick = () => {
      itens.splice(index,1);
      salvarItens();
      renderAdmin();
      renderForm(); // Atualiza o formulário de inspeção também
    };
    li.appendChild(btnDel);
    lista.appendChild(li);
  });
}

// Renderizar formulário de inspeção
function renderForm() {
  // Garantir que o elemento existe antes de tentar ler o valor
  const tipoElement = document.getElementById("tipoInspecao");
  if (!tipoElement) return;

  const tipoSelecionado = tipoElement.value;
  const form = document.getElementById("checklistForm");
  if (!form) return;

  form.innerHTML = "";
  itens.filter(item => item.tipo === tipoSelecionado).forEach(item => {
    const div = document.createElement("div");
    div.className = "item";
    // Usando template string para clareza
    div.innerHTML = `
      <div class="topic-title">${item.titulo}</div>
      <small>${item.descricao}</small>
      <select name="${item.titulo}">
        <option value="aprovado">Aprovado</option>
        <option value="reprovado">Reprovado</option>
      </select>
      <input type="text" name="obs_${item.titulo}" placeholder="Observações">
    `;
    form.appendChild(div);
  });
}

// Adicionar novo item
function adicionarItem() {
  const tituloInput = document.getElementById("novoTitulo");
  const descricaoInput = document.getElementById("novaDescricao");
  const tipoInput = document.getElementById("tipoItem");

  if (!tituloInput || !descricaoInput || !tipoInput) return; // Checagem básica

  const titulo = tituloInput.value.trim();
  const descricao = descricaoInput.value.trim();
  const tipo = tipoInput.value;

  if (!titulo || !descricao) {
    alert("Preencha título e descrição.");
    return;
  }

  itens.push({titulo, descricao, tipo});
  salvarItens();

  // Limpa os campos
  tituloInput.value = "";
  descricaoInput.value = "";

  // Atualiza listas
  renderAdmin();
  renderForm();
}

// --- Funções Utilitárias ---
function limparContent(){ document.getElementById("content").innerHTML = ""; }
function criarTitulo(texto){ const h = document.createElement("h3"); h.textContent = texto; return h; }

// --- Combate ---
function mostrarCombate(){
  limparContent();
  carregarRobos(); // Assume-se que existe em dashboard.js

  const content = document.getElementById("content");
  content.appendChild(criarTitulo("Realizar combate"));
  
  // O restante do código de mostrarCombate permanece o mesmo
  const nomes = Object.keys(robos); // Assume-se que 'robos' é global de dashboard.js
  if (nomes.length < 2){
    content.appendChild(document.createElement("p")).textContent = "É necessário ter pelo menos dois robôs cadastrados.";
    return;
  }

  const secCombate = document.createElement("section"); secCombate.id = "combate";

  const selWrap1 = document.createElement("div"); selWrap1.className = "combate-select";
  const label1 = document.createElement("label"); label1.textContent = "Robô 1:";
  const select1 = document.createElement("select"); selWrap1.appendChild(label1); selWrap1.appendChild(select1);

  const selWrap2 = document.createElement("div"); selWrap2.className = "combate-select";
  const label2 = document.createElement("label"); label2.textContent = "Robô 2:";
  const select2 = document.createElement("select"); selWrap2.appendChild(label2); selWrap2.appendChild(select2);

  // Popular selects com robôs
  select1.innerHTML = ""; select2.innerHTML = "";
  nomes.forEach(n => {
    select1.innerHTML += `<option value="${n}">${n}</option>`;
    select2.innerHTML += `<option value="${n}">${n}</option>`;
  });
  if (nomes.length>1) select2.selectedIndex = 1;

  const btnIniciar = document.createElement("button"); btnIniciar.textContent = "Iniciar combate";
  const placar = document.createElement("h4"); placar.id = "placar";
  const rodadasWrap = document.createElement("div"); rodadasWrap.id = "rodadas";
  const btnFinalizar = document.createElement("button"); btnFinalizar.textContent = "Finalizar combate"; btnFinalizar.style.display = "none";

  btnIniciar.onclick = () => {
    const c1 = select1.value, c2 = select2.value;
    if (!c1 || !c2) return alert("Selecione dois robôs.");
    if (c1 === c2) return alert("Robôs devem ser diferentes.");
    if (combateAtivo) return alert("Já existe um combate em andamento.");

    combateAtivo = true;
    let pontos1 = 0, pontos2 = 0, rodadasConfirmadas = 0;
    placar.textContent = `${c1}: ${pontos1} pts | ${c2}: ${pontos2} pts`;
    rodadasWrap.innerHTML = "";

    for (let i = 1; i <= 3; i++){
      const rodada = document.createElement("div"); rodada.className = "rodada-card";
      rodada.innerHTML = `<h4>Rodada ${i}</h4>`;

      const row1 = document.createElement("div"); row1.className = "rodada-row";
      const nivel1 = document.createElement("select"); niveis.forEach(n=> nivel1.innerHTML += `<option value="${n}">${n}</option>`);
      const ag1 = document.createElement("input"); ag1.type = "number"; ag1.min=0; ag1.max=5; ag1.value=0;
      row1.appendChild(Object.assign(document.createElement("label"),{textContent:`${c1} - Dano:`})); row1.appendChild(nivel1);
      row1.appendChild(Object.assign(document.createElement("label"),{textContent:`Agressividade:`})); row1.appendChild(ag1);

      const divider = document.createElement("div"); divider.className="rodada-divider";

      const row2 = document.createElement("div"); row2.className = "rodada-row";
      const nivel2 = document.createElement("select"); niveis.forEach(n=> nivel2.innerHTML += `<option value="${n}">${n}</option>`);
      const ag2 = document.createElement("input"); ag2.type="number"; ag2.min=0; ag2.max=5; ag2.value=0;
      row2.appendChild(Object.assign(document.createElement("label"),{textContent:`${c2} - Dano:`})); row2.appendChild(nivel2);
      row2.appendChild(Object.assign(document.createElement("label"),{textContent:`Agressividade:`})); row2.appendChild(ag2);

      const confirmar = document.createElement("button"); confirmar.textContent = `Confirmar Rodada ${i}`;
      confirmar.onclick = () => {
        const a1 = parseInt(ag1.value,10), a2 = parseInt(ag2.value,10);
        if (isNaN(a1)||isNaN(a2)||a1<0||a1>5||a2<0||a2>5) return alert("Agressividade entre 0 e 5.");
        const [p1,p2] = tabela_dano[nivel1.value][nivel2.value];
        pontos1 += p1 + a1; pontos2 += p2 + a2;
        confirmar.disabled = true; nivel1.disabled = nivel2.disabled = ag1.disabled = ag2.disabled = true;
        rodadasConfirmadas++; placar.textContent = `${c1}: ${pontos1} pts | ${c2}: ${pontos2} pts`;
        if (rodadasConfirmadas === 3){ btnFinalizar.style.display = "inline-block"; btnFinalizar.disabled = false; }
      };

      rodada.appendChild(row1); rodada.appendChild(divider); rodada.appendChild(row2); rodada.appendChild(confirmar);
      rodadasWrap.appendChild(rodada);
    }

    btnFinalizar.onclick = () => {
      robos[c1].pontos = (robos[c1].pontos || 0) + pontos1;
      robos[c2].pontos = (robos[c2].pontos || 0) + pontos2;
      salvarRobos(); // Assume-se que existe em dashboard.js
      combateAtivo = false;
      alert(`Combate finalizado!\n${c1}: ${pontos1} pontos\n${c2}: ${pontos2} pontos`);
      mostrarDashboard(); // Assume-se que existe em dashboard.js
    };
  };

  secCombate.appendChild(selWrap1); secCombate.appendChild(selWrap2);
  secCombate.appendChild(btnIniciar); secCombate.appendChild(placar);
  secCombate.appendChild(rodadasWrap); secCombate.appendChild(btnFinalizar);
  content.appendChild(secCombate);
}

// --- Tabela de Dano ---
function mostrarTabela(){
  limparContent();
  const content=document.getElementById("content");

  const block=document.createElement("div"); block.className="table-block";
  const title=document.createElement("div"); title.className="section-title"; title.textContent="Tabela de Dano TRIF 2025";
  block.appendChild(title);

  const table=document.createElement("table"); table.className="tabela-dano";
  // Construção do cabeçalho
  table.innerHTML = `<thead><tr><th>Nível</th><th>Trivial</th><th>Cosmético</th><th>Menor</th><th>Significativo</th><th>Maior</th><th>Massivo</th></tr></thead>`;
  const tbody=document.createElement("tbody");
  
  // Os dados da tabela visual
  const linhas = [
    ["Trivial","9 / 9","10 / 8","12 / 6","14 / 4","16 / 2","18 / 0"],
    ["Cosmético","8 / 10","9 / 9","10 / 8","12 / 6","14 / 4","17 / 1"],
    ["Menor","6 / 12","8 / 10","9 / 9","11 / 7","13 / 5","15 / 3"],
    ["Significativo","4 / 14","6 / 12","7 / 11","9 / 9","11 / 7","13 / 5"],
    ["Maior","2 / 16","4 / 14","5 / 13","7 / 11","9 / 9","11 / 7"],
    ["Massivo","0 / 18","1 / 17","3 / 15","5 / 13","7 / 11","9 / 9"],
  ];
  linhas.forEach(l=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${l[0]}</td><td>${l[1]}</td><td>${l[2]}</td><td>${l[3]}</td><td>${l[4]}</td><td>${l[5]}</td><td>${l[6]}</td>`;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody); block.appendChild(table); content.appendChild(block);
}

// --- Ranking ---
function mostrarRanking(){
  limparContent();
  carregarRobos(); // Assume-se que existe em dashboard.js

  const content=document.getElementById("content");
  content.appendChild(criarTitulo("Ranking de Robôs"));

  const lista = Object.entries(robos).map(([nome, dados]) => ({ nome, pontos: dados.pontos || 0 }));
  const ranking = lista.sort((a,b)=> b.pontos - a.pontos);

  const table=document.createElement("table"); table.className="ranking-table";
  table.innerHTML=`<thead><tr><th>Posição</th><th>Robô</th><th>Pontos</th></tr></thead>`;
  const tbody=document.createElement("tbody");

  if (ranking.length===0){
    const tr=document.createElement("tr");
    const td=document.createElement("td"); td.colSpan=3; td.textContent="Nenhum robô no ranking ainda.";
    tr.appendChild(td); tbody.appendChild(tr);
  } else {
    ranking.forEach((item,i)=>{
      const tr=document.createElement("tr");
      tr.innerHTML=`<td>${i+1}º</td><td>${item.nome}</td><td>${item.pontos}</td>`;
      tbody.appendChild(tr);
    });
  }
  table.appendChild(tbody); content.appendChild(table);
}

// --- Inicialização (Centralizada) ---

document.addEventListener("DOMContentLoaded", () => {
  // Configuração dos eventos de navegação
  const btnDashboard = document.getElementById("btnDashboard");
  const btnCombate = document.getElementById("btnCombate");
  const btnTabela = document.getElementById("btnTabela");
  const btnRanking = document.getElementById("btnRanking");
  
  if (btnDashboard) btnDashboard.addEventListener("click", mostrarDashboard); // Assume-se que existe em dashboard.js
  if (btnCombate) btnCombate.addEventListener("click", mostrarCombate);
  if (btnTabela) btnTabela.addEventListener("click", mostrarTabela);
  if (btnRanking) btnRanking.addEventListener("click", mostrarRanking);

  // Inicialização da Checklist
  const btnAdd = document.querySelector("button[onclick='adicionarItem()']");
  if (btnAdd) {
      // Garante que a função 'adicionarItem' está no escopo global para o 'onclick' funcionar no HTML
      window.adicionarItem = adicionarItem; 
      btnAdd.disabled = true;
  }

  // Adiciona o listener para mudança de tipo de inspeção
  const btnInspecao = document.getElementById("btnInspecao");
if (btnInspecao) btnInspecao.addEventListener("click", () => {
  limparContent();
  const content = document.getElementById("content");

  content.innerHTML = `
    <div class="section">
      <h3>Login Administrador</h3>
      <input type="password" id="adminSenha" placeholder="Digite a senha">
      <button class="btn" id="btnLoginAdmin">Entrar</button>
      <p id="loginMsg"></p>
    </div>

    <div class="section hidden" id="adminSection">
      <h3>Administração - Configurar Itens</h3>
      <input type="text" id="novoTitulo" placeholder="Título do tópico">
      <input type="text" id="novaDescricao" placeholder="Descrição da avaliação">
      <select id="tipoItem">
        <option value="estatica">Estática</option>
        <option value="dinamica">Dinâmica</option>
      </select>
      <button class="btn" id="btnAdicionarItem">Adicionar Item</button>
      <ul id="listaAdmin"></ul>
    </div>

    <div class="section">
      <h3>Formulário de Inspeção</h3>
      <div class="item">
        <label>Tipo de Inspeção</label>
        <select id="tipoInspecao">
          <option value="estatica">Inspeção Estática</option>
          <option value="dinamica">Inspeção Dinâmica</option>
        </select>
      </div>
      <div class="item">
        <label>Robô</label>
        <select id="roboInspecao"></select>
      </div>
      <form id="checklistForm"></form>
      <button type="button" class="btn" id="btnGerarRelatorio">Gerar Relatório</button>
      <div id="resultado" class="result"></div>
    </div>
  `;

  // --- conectar eventos e inicializar componentes ---

  // 1) Popular lista de robôs (carrega robos via função existente)
  if (typeof carregarRobos === "function") carregarRobos();
  const roboSelect = document.getElementById("roboInspecao");
  roboSelect.innerHTML = "";
  if (window.robos && Object.keys(robos).length > 0) {
    Object.keys(robos).forEach(nome => {
      roboSelect.innerHTML += `<option value="${nome}">${nome}</option>`;
    });
  } else {
    roboSelect.innerHTML = `<option value="">Nenhum robô cadastrado</option>`;
  }

  // 2) Tipo de inspeção muda o formulário
  const tipoInspecaoEl = document.getElementById("tipoInspecao");
  tipoInspecaoEl.addEventListener("change", () => {
    if (typeof renderForm === "function") renderForm();
  });

  // 3) Botão gerar relatório
  const btnGerar = document.getElementById("btnGerarRelatorio");
  btnGerar.addEventListener("click", () => {
    if (typeof gerarRelatorio === "function") gerarRelatorio();
  });

  // 4) Login admin (mostra seção de administração apenas após login)
  const btnLogin = document.getElementById("btnLoginAdmin");
  const loginMsg = document.getElementById("loginMsg");
  btnLogin.addEventListener("click", () => {
    const senhaEl = document.getElementById("adminSenha");
    const senha = senhaEl ? senhaEl.value : "";
    // se existir função loginAdmin definida externamente, use-a; caso contrário, validar senha padrão
    if (typeof loginAdmin === "function") {
      // loginAdmin deve mostrar #adminSection ao permitir
      loginAdmin(senha);
      // após chamada, atualiza visibilidade e lista se ficou logado
      const adminSection = document.getElementById("adminSection");
      if (!adminSection.classList.contains("hidden")) {
        if (typeof renderAdmin === "function") renderAdmin();
      }
    } else {
      // validação simples caso não haja login.js
      if (senha === "admin2025") {
        document.getElementById("adminSection").classList.remove("hidden");
        loginMsg.textContent = "Acesso liberado.";
        if (typeof renderAdmin === "function") renderAdmin();
      } else {
        loginMsg.textContent = "Senha incorreta.";
      }
    }
  });

  // 5) Habilitar botão Adicionar Item e conectá-lo à função adicionarItem()
  const btnAdd = document.getElementById("btnAdicionarItem");
  if (btnAdd) {
    btnAdd.disabled = false;
    btnAdd.addEventListener("click", () => {
      if (typeof adicionarItem === "function") {
        adicionarItem();
        // após adicionar, atualiza lista de tópicos visíveis no formulário
        if (typeof renderAdmin === "function") renderAdmin();
        if (typeof renderForm === "function") renderForm();
      } else {
        alert("Função adicionarItem() não encontrada.");
      }
    });
  }

  // 6) Renderizar admin/form inicialmente (form aparece conforme tipo)
  if (typeof renderAdmin === "function") renderAdmin();
  if (typeof renderForm === "function") renderForm();});


  // Exibe o dashboard na inicialização
  mostrarDashboard(); // Assume-se que existe em dashboard.js
});