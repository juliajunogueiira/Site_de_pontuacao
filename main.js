// main.js
// Contém: estado global mínimo, tabela de dano, combate, tabela visual, ranking, inicialização menu
// Depende de functions exported implicitly by dashboard.js (dadosCompeticao, robos, salvarRobos, carregarRobos, mostrarDashboard etc.)

// OBS: dashboard.js define dadosCompeticao e robos no escopo global (como já era antes),
//      então main.js pode usar essas variáveis diretamente.

const tabela_dano = {
  "Trivial":     {"Trivial":[9,9],"Cosmético":[10,8],"Menor":[12,6],"Significativo":[14,4],"Maior":[16,2],"Massivo":[18,0]},
  "Cosmético":   {"Trivial":[8,10],"Cosmético":[9,9],"Menor":[10,8],"Significativo":[12,6],"Maior":[14,4],"Massivo":[17,1]},
  "Menor":       {"Trivial":[6,12],"Cosmético":[8,10],"Menor":[9,9],"Significativo":[11,7],"Maior":[13,5],"Massivo":[15,3]},
  "Significativo":{"Trivial":[4,14],"Cosmético":[6,12],"Menor":[7,11],"Significativo":[9,9],"Maior":[11,7],"Massivo":[13,5]},
  "Maior":       {"Trivial":[2,16],"Cosmético":[4,14],"Menor":[5,13],"Significativo":[7,11],"Maior":[9,9],"Massivo":[11,7]},
  "Massivo":     {"Trivial":[0,18],"Cosmético":[1,17],"Menor":[3,15],"Significativo":[5,13],"Maior":[7,11],"Massivo":[9,9]}
};
const niveis = Object.keys(tabela_dano);

// utilitários (reaproveitar os do dashboard.js)
function limparContent(){ document.getElementById("content").innerHTML = ""; }
function criarTitulo(texto){ const h = document.createElement("h3"); h.textContent = texto; return h; }

// Combate, Tabela, Ranking (mesmo código que você já tinha)
let combateAtivo = false;

function mostrarCombate(){
  limparContent();
  carregarRobos();

  const content = document.getElementById("content");
  content.appendChild(criarTitulo("Realizar combate"));

  const nomes = Object.keys(robos);
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
      salvarRobos();
      combateAtivo = false;
      alert(`Combate finalizado!\n${c1}: ${pontos1} pontos\n${c2}: ${pontos2} pontos`);
      mostrarDashboard();
    };
  };

  secCombate.appendChild(selWrap1); secCombate.appendChild(selWrap2);
  secCombate.appendChild(btnIniciar); secCombate.appendChild(placar);
  secCombate.appendChild(rodadasWrap); secCombate.appendChild(btnFinalizar);
  content.appendChild(secCombate);
}

// Tabela de Dano e Ranking (mesmo que já tinha)...
function mostrarTabela(){
  limparContent();
  const content=document.getElementById("content");

  const block=document.createElement("div"); block.className="table-block";
  const title=document.createElement("div"); title.className="section-title"; title.textContent="Tabela de Dano TRIF 2025";
  block.appendChild(title);

  const table=document.createElement("table"); table.className="tabela-dano";
  table.innerHTML = `<thead><tr><th>Nível</th><th>Trivial</th><th>Cosmético</th><th>Menor</th><th>Significativo</th><th>Maior</th><th>Massivo</th></tr></thead>`;
  const tbody=document.createElement("tbody");
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

function mostrarRanking(){
  limparContent();
  carregarRobos();

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

// Inicialização

  document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnDashboard").addEventListener("click", mostrarDashboard);
  document.getElementById("btnCombate").addEventListener("click", mostrarCombate);
  document.getElementById("btnTabela").addEventListener("click", mostrarTabela);
  document.getElementById("btnRanking").addEventListener("click", mostrarRanking);

  // Botão inspeção chama o checklist
  const btnInspecao = document.getElementById("btnInspecao");
  if (btnInspecao) btnInspecao.addEventListener("click", () => {
    limparContent();
    // aqui usamos as funções do checklist.js
    const content = document.getElementById("content");
    content.innerHTML = `
      <h3>Checklist de Inspeção</h3>
      <div class="item">
        <label>Tipo de Inspeção</label>
        <select id="tipoInspecao" onchange="renderForm()">
          <option value="estatica">Inspeção Estática</option>
          <option value="dinamica">Inspeção Dinâmica</option>
        </select>
      </div>
      <form id="checklistForm"></form>
      <button type="button" class="btn" onclick="gerarRelatorio()">Gerar Relatório</button>
      <div id="resultado" class="result"></div>
      <div id="listaAdmin"></div>
    `;
    renderAdmin();
    renderForm();
  });

  mostrarDashboard();
});

