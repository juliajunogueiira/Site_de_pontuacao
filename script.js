// Dicionário de combatentes
let combatentes = {};

// Função para limpar conteúdo
function limparContent() {
  document.getElementById("content").innerHTML = "";
}

// Registrar combatente
function mostrarRegistrar() {
  limparContent();
  let content = document.getElementById("content");
  content.innerHTML = "<h3>Registrar Combatente</h3>";
  let input = document.createElement("input");
  input.placeholder = "Nome do combatente";
  let btn = document.createElement("button");
  btn.textContent = "Registrar";
  btn.onclick = () => {
    let nome = input.value.trim();
    if (!nome) {
      alert("Erro: O nome não pode ser vazio.");
    } else if (combatentes[nome]) {
      alert("Erro: " + nome + " já está registrado.");
    } else {
      combatentes[nome] = 0;
      alert(nome + " registrado com sucesso!");
      input.value = "";
    }
  };
  content.appendChild(input);
  content.appendChild(btn);
}

// Lista de participantes
function mostrarLista() {
  limparContent();
  let content = document.getElementById("content");
  content.innerHTML = "<h3>Lista de Participantes</h3>";
  if (Object.keys(combatentes).length === 0) {
    content.innerHTML += "<p>Nenhum participante registrado.</p>";
  } else {
    for (let nome in combatentes) {
      let p = document.createElement("p");
      p.textContent = "- " + nome;
      content.appendChild(p);
    }
  }
}

// Ranking
function mostrarRanking() {
  limparContent();
  let content = document.getElementById("content");
  content.innerHTML = "<h3>Ranking Geral</h3>";
  let ranking = Object.entries(combatentes).sort((a,b) => b[1]-a[1]);
  if (ranking.length === 0) {
    content.innerHTML += "<p>Nenhum combatente no ranking ainda.</p>";
  } else {
    ranking.forEach((item, i) => {
      let p = document.createElement("p");
      p.textContent = (i+1) + "º Lugar: " + item[0] + " - " + item[1] + " pontos";
      content.appendChild(p);
    });
  }
}

// Realizar combate
function mostrarCombate() {
  limparContent();
  let content = document.getElementById("content");
  content.innerHTML = "<h3>Realizar Combate</h3>";
  let nomes = Object.keys(combatentes);
  if (nomes.length < 2) {
    content.innerHTML += "<p>É necessário ter pelo menos dois combatentes registrados.</p>";
    return;
  }
  // Seleção dos combatentes
  let select1 = document.createElement("select");
  let select2 = document.createElement("select");
  nomes.forEach(n => {
    let opt1 = document.createElement("option");
    opt1.value = n; opt1.textContent = n;
    select1.appendChild(opt1);
    let opt2 = document.createElement("option");
    opt2.value = n; opt2.textContent = n;
    select2.appendChild(opt2);
  });
  content.appendChild(select1);
  content.appendChild(select2);

  let btn = document.createElement("button");
  btn.textContent = "Iniciar Combate";
  btn.onclick = () => {
    let c1 = select1.value;
    let c2 = select2.value;
    if (c1 === c2) {
      alert("Erro: Os combatentes devem ser diferentes.");
      return;
    }
    let pontos1 = 0, pontos2 = 0;
    for (let rodada=1; rodada<=3; rodada++) {
      let p1 = parseInt(prompt("Pontos de " + c1 + " na rodada " + rodada + ":"));
      let p2 = parseInt(prompt("Pontos de " + c2 + " na rodada " + rodada + ":"));
      if (isNaN(p1) || isNaN(p2)) {
        alert("Erro: valores inválidos.");
        return;
      }
      pontos1 += p1;
      pontos2 += p2;
      alert("Rodada " + rodada + " concluída. Placar parcial: " + c1 + " " + pontos1 + " - " + pontos2 + " " + c2);
    }
    combatentes[c1] += pontos1;
    combatentes[c2] += pontos2;
    alert("Combate finalizado! Pontuações atualizadas.");
  };
  content.appendChild(btn);
}
