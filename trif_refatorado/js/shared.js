// shared.js - Módulos compartilhados entre Admin, Staff e Jurados - VERSÃO ATUALIZADA

// ==========================================
// 1. Módulo de Tabela de Dano
// ==========================================
const TabelaDano = {
  render() {
    DOM.clear("#content");
    const content = document.getElementById("content");

    const section = DOM.create("section", { className: "section" });
    section.appendChild(
      DOM.createTitle("Tabela Oficial de Referência de Dano")
    );

    let html = `
      <div style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <th style="background:#1e293b; color:#fff;">Atacante ↓ / Defensor →</th>
              <th>Trivial</th>
              <th>Cosmético</th>
              <th>Menor</th>
              <th>Significativo</th>
              <th>Maior</th>
              <th>Massivo</th>
            </tr>
          </thead>
          <tbody>
    `;

    // Verifica se as constantes globais existem antes de iterar
    if (
      typeof NIVEIS_DANO !== "undefined" &&
      typeof MATRIZ_DANO_OFICIAL !== "undefined"
    ) {
      NIVEIS_DANO.forEach((atacante) => {
        html += `<tr><th style="background:#f3f4f6; font-weight:700;">${atacante}</th>`;
        NIVEIS_DANO.forEach((defensor) => {
          const [ptsAtacante, ptsDefensor] =
            MATRIZ_DANO_OFICIAL[atacante][defensor];
          html += `<td style="text-align:center;"><strong>${ptsAtacante}</strong> / ${ptsDefensor}</td>`;
        });
        html += `</tr>`;
      });
    }

    html += `
          </tbody>
        </table>
      </div>
      <p style="margin-top:15px; font-size:0.9em; color:#6b7280; text-align:center;">
        <strong>Legenda:</strong> Pontos do Atacante / Pontos do Defensor<br>
        <em>Conforme regulamento oficial TRIF 2025</em>
      </p>
    `;

    section.innerHTML += html;
    content.appendChild(section);
  },
};

// ==========================================
// 2. Módulo de Ranking
// ==========================================
const Ranking = {
  filtroAtual: "todas",

  render() {
    DOM.clear("#content");
    const content = document.getElementById("content");

    const section = DOM.create("section", { className: "section" });
    section.appendChild(DOM.createTitle("Ranking de Pontuação"));

    section.innerHTML += `
      <div style="background: #f9fafb; padding: 16px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          <label style="margin: 0; font-weight: 700; color: #1f2937;">🔍 Filtrar por Classe:</label>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button id="btnFiltroTodas" class="btn-filtro ${
              this.filtroAtual === "todas" ? "active" : ""
            }" onclick="Ranking.filtrar('todas')">Todas</button>
            <button id="btnFiltroAnt" class="btn-filtro ${
              this.filtroAtual === "Ant" ? "active" : ""
            }" onclick="Ranking.filtrar('Ant')">🐜 Ant</button>
            <button id="btnFiltroCupim" class="btn-filtro ${
              this.filtroAtual === "Cupim" ? "active" : ""
            }" onclick="Ranking.filtrar('Cupim')">🪲 Cupim</button>
          </div>
        </div>
      </div>
      <div id="rankingTable"></div>
    `;

    content.appendChild(section);
    this.renderTabela();
    this.adicionarEstilos();
  },

  filtrar(classe) {
    this.filtroAtual = classe;
    document
      .querySelectorAll(".btn-filtro")
      .forEach((btn) => btn.classList.remove("active"));

    if (classe === "todas")
      document.getElementById("btnFiltroTodas").classList.add("active");
    else if (classe === "Ant")
      document.getElementById("btnFiltroAnt").classList.add("active");
    else if (classe === "Cupim")
      document.getElementById("btnFiltroCupim").classList.add("active");

    this.renderTabela();
  },

  renderTabela() {
    const container = document.getElementById("rankingTable");
    const robos = dataManager.getRobos();

    let lista = Object.entries(robos).map(([nome, dados]) => ({
      nome,
      pontos: dados.pontos || 0,
      equipe: dados.equipe || "",
      classe: dados.classe || "",
    }));

    if (this.filtroAtual !== "todas") {
      lista = lista.filter((item) => item.classe === this.filtroAtual);
    }

    lista.sort((a, b) => b.pontos - a.pontos);

    if (lista.length === 0) {
      container.innerHTML = `<div style="text-align: center; padding: 40px; color: #6b7280;">Nenhum robô encontrado neste filtro.</div>`;
      return;
    }

    let html = `
      <table>
        <thead>
          <tr>
            <th>Pos.</th>
            <th>Robô</th>
            <th>Equipe</th>
            <th>Classe</th>
            <th>Pontos</th>
          </tr>
        </thead>
        <tbody>
    `;

    lista.forEach((item, i) => {
      let style =
        i === 0
          ? "background:#fef3c7;"
          : i === 1
          ? "background:#e5e7eb;"
          : i === 2
          ? "background:#fed7aa;"
          : "";
      let medal =
        i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}º`;
      const classeIcon =
        item.classe === "Ant" ? "🐜" : item.classe === "Cupim" ? "🪲" : "";

      html += `
        <tr style="${style}">
          <td><strong>${medal}</strong></td>
          <td><strong>${DOM.escape(item.nome)}</strong></td>
          <td>${DOM.escape(item.equipe)}</td>
          <td>${classeIcon} ${DOM.escape(item.classe || "-")}</td>
          <td><strong style="color:#10b981;">${Formatters.number(
            item.pontos,
            1
          )}</strong></td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
  },

  adicionarEstilos() {
    if (!document.getElementById("ranking-filter-styles")) {
      const style = document.createElement("style");
      style.id = "ranking-filter-styles";
      style.textContent = `
        .btn-filtro { padding: 6px 12px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
        .btn-filtro:hover { background: #f3f4f6; }
        .btn-filtro.active { background: #10b981; color: white; border-color: #059669; }
      `;
      document.head.appendChild(style);
    }
  },
};

// ==========================================
// 3. Módulo de Relatórios (REFORMULADO)
// ==========================================
const Relatorios = {
  filtroTexto: "",
  filtroTipo: "todos",
  filtroStatus: "todos",

  render() {
    DOM.clear("#content");
    const content = document.getElementById("content");

    const section = DOM.create("section", { className: "section" });
    section.appendChild(DOM.createTitle("Histórico de Inspeções"));

    // Área de Filtros
    section.innerHTML += `
      <div style="background: #f9fafb; padding: 20px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
        <h4 style="margin: 0 0 16px 0; color: #1f2937;">🔍 Filtrar Relatórios</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 12px;">
          <div>
            <label style="display:block; font-size:12px; font-weight:600; color:#4b5563; margin-bottom:4px;">Buscar Robô</label>
            <input type="text" id="filtroTextoInput" placeholder="Nome do robô..." style="width: 100%;" onkeyup="Relatorios.aplicarFiltros()">
          </div>
          <div>
            <label style="display:block; font-size:12px; font-weight:600; color:#4b5563; margin-bottom:4px;">Tipo</label>
            <select id="filtroTipoSelect" style="width: 100%;" onchange="Relatorios.aplicarFiltros()">
              <option value="todos">Todos</option>
              <option value="Estática">Estática</option>
              <option value="Dinâmica">Dinâmica</option>
            </select>
          </div>
          <div>
            <label style="display:block; font-size:12px; font-weight:600; color:#4b5563; margin-bottom:4px;">Status</label>
            <select id="filtroStatusSelect" style="width: 100%;" onchange="Relatorios.aplicarFiltros()">
              <option value="todos">Todos</option>
              <option value="aprovado">✅ Aprovados</option>
              <option value="reprovado">⚠️ Pendentes</option>
            </select>
          </div>
        </div>
        <button onclick="Relatorios.limparFiltros()" class="btn-edit" style="width: 100%;">🔄 Limpar Filtros</button>
      </div>
      <div id="relatoriosList"></div>
    `;

    content.appendChild(section);
    this.renderLista();
  },

  aplicarFiltros() {
    this.filtroTexto = document
      .getElementById("filtroTextoInput")
      .value.toLowerCase();
    this.filtroTipo = document.getElementById("filtroTipoSelect").value;
    this.filtroStatus = document.getElementById("filtroStatusSelect").value;
    this.renderLista();
  },

  limparFiltros() {
    this.filtroTexto = "";
    this.filtroTipo = "todos";
    this.filtroStatus = "todos";
    document.getElementById("filtroTextoInput").value = "";
    document.getElementById("filtroTipoSelect").value = "todos";
    document.getElementById("filtroStatusSelect").value = "todos";
    this.renderLista();
  },

  renderLista() {
    const container = document.getElementById("relatoriosList");
    let relatorios = dataManager.getRelatorios();

    // Aplicação dos Filtros
    if (this.filtroTexto)
      relatorios = relatorios.filter((r) =>
        r.robo.toLowerCase().includes(this.filtroTexto)
      );
    if (this.filtroTipo !== "todos")
      relatorios = relatorios.filter((r) => r.tipo === this.filtroTipo);
    if (this.filtroStatus !== "todos") {
      relatorios = relatorios.filter((r) => {
        const reprovados = r.resultados.filter(
          (res) => res.status === "reprovado"
        ).length;
        return this.filtroStatus === "aprovado"
          ? reprovados === 0
          : reprovados > 0;
      });
    }

    if (relatorios.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:40px; color:#6b7280;">Nenhum relatório encontrado.</div>`;
      return;
    }

    // Renderiza a lista (mantendo formato histórico visualmente)
    // MAS: os botões agora chamam a função unificada passando o NOME do robô
    let html = `<div style="display: flex; flex-direction: column; gap: 12px;">`;

    [...relatorios].reverse().forEach((rel) => {
      const reprovados = rel.resultados.filter(
        (r) => r.status === "reprovado"
      ).length;
      const statusColor = reprovados > 0 ? "#ef4444" : "#10b981";
      const statusText = reprovados === 0 ? "✅ Aprovado" : "⚠️ Pendências";

      html += `
        <div style="border: 1px solid #e5e7eb; border-left: 5px solid ${statusColor}; padding: 16px; border-radius: 8px; background: #fff;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px; flex-wrap: wrap; gap: 12px;">
            <div>
              <strong style="font-size: 18px; color: #1f2937;">🤖 ${DOM.escape(
                rel.robo
              )}</strong>
              <div style="margin-top: 6px;">
                <span style="padding: 4px 10px; background: #f3f4f6; border-radius: 4px; font-size: 13px; font-weight: 600; margin-right: 8px;">${
                  rel.tipo
                }</span>
                <span style="color: ${statusColor}; font-weight: 700; font-size: 14px;">${statusText}</span>
              </div>
            </div>
            <div style="display: flex; gap: 8px;">
              <button onclick="Relatorios.verDetalhes('${DOM.escape(
                rel.robo
              )}')" class="btn-edit" style="font-size: 13px;">👁️ Ver Histórico</button>
              <button onclick="Relatorios.exportarPDF('${DOM.escape(
                rel.robo
              )}')" class="btn-save" style="font-size: 13px;">📄 PDF Unificado</button>
            </div>
          </div>
          <div style="font-size: 13px; color: #6b7280;">
            📅 ${Formatters.date(rel.criadoEm)} • ID: #${rel.id}
          </div>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;
  },

  // FUNÇÃO REESCRITA: Agrupa cadastro e checklists
  verDetalhes(nomeRobo) {
    const todosRelatorios = dataManager.getRelatorios();
    // Filtra todos os relatórios deste robô e ordena (mais recente primeiro)
    const historico = todosRelatorios.filter((r) => r.robo === nomeRobo);
    historico.sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));

    const roboInfo = dataManager.getRobo(nomeRobo);
    const classeIcon =
      roboInfo?.classe === "Ant"
        ? "🐜"
        : roboInfo?.classe === "Cupim"
        ? "🪲"
        : "🤖";

    DOM.clear("#content");
    const content = document.getElementById("content");
    const section = DOM.create("section", { className: "section" });

    // Cabeçalho e Botões
    section.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
        <h3 style="margin: 0;">Ficha Técnica & Inspeções</h3>
        <div style="display: flex; gap: 8px;">
          <button onclick="Relatorios.render()" class="btn-edit">← Voltar</button>
          <button onclick="Relatorios.exportarPDF('${DOM.escape(
            nomeRobo
          )}')" class="btn-save">📄 Exportar PDF</button>
        </div>
      </div>

      <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 24px; display: flex; gap: 20px; align-items: center; flex-wrap: wrap; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        ${
          roboInfo?.fotoBase64
            ? `<img src="${roboInfo.fotoBase64}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb;">`
            : `<div style="width: 100px; height: 100px; background: #f3f4f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 40px;">📷</div>`
        }
        <div style="flex: 1;">
          <h2 style="margin: 0 0 8px 0; color: #1f2937;">${classeIcon} ${DOM.escape(
      nomeRobo
    )}</h2>
          <div style="display: flex; gap: 20px; flex-wrap: wrap; color: #4b5563; font-size: 14px;">
            <span><strong>Equipe:</strong> ${DOM.escape(
              roboInfo?.equipe || "-"
            )}</span>
            <span><strong>Peso:</strong> ${roboInfo?.peso || 0}g</span>
            <span><strong>Classe:</strong> ${roboInfo?.classe || "-"}</span>
            <span style="color: #10b981;"><strong>Pontos:</strong> ${
              roboInfo?.pontos || 0
            }</span>
          </div>
          ${
            roboInfo?.descricao
              ? `<p style="margin: 8px 0 0 0; color: #6b7280; font-size: 13px; font-style: italic;">"${roboInfo.descricao}"</p>`
              : ""
          }
        </div>
      </div>

      <h4 style="margin: 0 0 16px 0; color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
        📋 Histórico de Checklists (${historico.length})
      </h4>

      <div style="display: flex; flex-direction: column; gap: 24px;">
    `;

    if (historico.length === 0) {
      section.innerHTML += `<p style="color: #6b7280;">Nenhuma inspeção realizada para este robô.</p>`;
    }

    // Loop para mostrar Estática, Dinâmica, etc., juntas
    historico.forEach((rel) => {
      const aprovados = rel.resultados.filter(
        (r) => r.status === "aprovado"
      ).length;
      const reprovados = rel.resultados.length - aprovados;
      const statusColor = reprovados > 0 ? "#ef4444" : "#10b981";
      const statusIcon = reprovados === 0 ? "✅ Aprovado" : "⚠️ Com Pendências";

      let checklistHtml = "";
      rel.resultados.forEach((item, idx) => {
        const itemIcon = item.status === "aprovado" ? "✅" : "❌";
        const bgItem = item.status === "aprovado" ? "white" : "#fef2f2";

        checklistHtml += `
          <div style="padding: 10px; border-bottom: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: start; background: ${bgItem};">
            <div style="flex: 1; padding-right: 10px;">
              <span style="font-weight: 600; color: #374151; font-size: 14px;">${
                idx + 1
              }. ${DOM.escape(item.titulo)}</span>
              ${
                item.obs
                  ? `<div style="font-size: 12px; color: #ef4444; margin-top: 4px; font-weight: 500;">Obs: ${DOM.escape(
                      item.obs
                    )}</div>`
                  : ""
              }
            </div>
            <span style="font-size: 18px;">${itemIcon}</span>
          </div>
        `;
      });

      section.innerHTML += `
        <div style="border: 1px solid ${statusColor}; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <div style="background: ${statusColor}; color: white; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 700; font-size: 15px;">Inspeção ${
              rel.tipo
            }</span>
            <span style="font-size: 13px; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 4px;">
              📅 ${Formatters.date(rel.criadoEm)}
            </span>
          </div>
          <div style="background: #f9fafb; padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">
             <strong style="color: ${statusColor}; font-size: 15px;">${statusIcon}</strong>
             <span style="color: #6b7280; font-size: 13px; margin-left: 8px;">(${aprovados} OK / ${reprovados} NOK)</span>
          </div>
          <div style="background: white;">
            ${checklistHtml}
          </div>
        </div>
      `;
    });

    section.innerHTML += `</div>`;
    content.appendChild(section);
  },

  // FUNÇÃO REESCRITA: Gera PDF unificado
  exportarPDF(nomeRobo) {
    const todosRelatorios = dataManager.getRelatorios();
    // Filtra e ordena cronologicamente (antigo -> novo) para o relatório
    const relatorios = todosRelatorios
      .filter((r) => r.robo === nomeRobo)
      .sort((a, b) => new Date(a.criadoEm) - new Date(b.criadoEm));

    const competicao = dataManager.getCompeticao();
    const robo = dataManager.getRobo(nomeRobo);
    const classeIcon =
      robo?.classe === "Ant" ? "🐜" : robo?.classe === "Cupim" ? "🪲" : "";

    // Status Geral (se tiver QUALQUER reprovação em QUALQUER relatório, destaca em vermelho)
    const temPendencia = relatorios.some((rel) =>
      rel.resultados.some((r) => r.status === "reprovado")
    );
    const corGeral = temPendencia ? "#ef4444" : "#10b981";
    const textoStatus = temPendencia ? "PENDENTE" : "APROVADO";

    const printWindow = window.open("", "_blank");

    // Gerar HTML das tabelas de inspeção
    let htmlChecklists = "";

    if (relatorios.length === 0) {
      htmlChecklists = `<p style="text-align:center; color:#666; padding:20px;">Nenhum relatório de inspeção registrado.</p>`;
    } else {
      relatorios.forEach((rel) => {
        const falhaLocal = rel.resultados.some((r) => r.status === "reprovado");
        const corLocal = falhaLocal ? "#ef4444" : "#10b981";
        const iconLocal = falhaLocal ? "⚠️" : "✅";

        let linhas = "";
        rel.resultados.forEach((item, idx) => {
          const isOk = item.status === "aprovado";
          const styleRow = isOk ? "" : "background: #fef2f2; color: #991b1b;";

          linhas += `
            <tr style="${styleRow}">
              <td style="padding:6px; border-bottom:1px solid #eee; text-align:center;">${
                idx + 1
              }</td>
              <td style="padding:6px; border-bottom:1px solid #eee;"><strong>${
                item.titulo
              }</strong></td>
              <td style="padding:6px; border-bottom:1px solid #eee; font-size:11px;">${
                item.obs || "-"
              }</td>
              <td style="padding:6px; border-bottom:1px solid #eee; text-align:center; font-weight:bold;">${
                isOk ? "OK" : "NOK"
              }</td>
            </tr>
          `;
        });

        htmlChecklists += `
          <div style="margin-bottom: 25px; page-break-inside: avoid; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
            <div style="background: ${corLocal}; color: white; padding: 8px 12px; font-weight: bold; font-size: 14px; display: flex; justify-content: space-between;">
              <span>${iconLocal} Inspeção ${rel.tipo}</span>
              <span style="font-weight: normal; font-size: 12px;">${Formatters.date(
                rel.criadoEm
              )}</span>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              <thead>
                <tr style="background: #f9fafb;">
                  <th style="width: 30px; text-align: center; padding: 6px;">#</th>
                  <th style="text-align: left; padding: 6px;">Item</th>
                  <th style="text-align: left; padding: 6px;">Observação</th>
                  <th style="width: 50px; text-align: center; padding: 6px;">Status</th>
                </tr>
              </thead>
              <tbody>${linhas}</tbody>
            </table>
          </div>
        `;
      });
    }

    // Imagem do Robô
    const imgHtml = robo?.fotoBase64
      ? `<img src="${robo.fotoBase64}" style="width:120px; height:120px; object-fit:cover; border-radius:8px; border:2px solid #e5e7eb;">`
      : `<div style="width:120px; height:120px; background:#f3f4f6; border-radius:8px; border:2px solid #e5e7eb; display:flex; align-items:center; justify-content:center; font-size:40px; color:#ccc;">📷</div>`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ficha Técnica - ${nomeRobo}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; margin: 0; padding: 20px; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 3px solid ${corGeral}; padding-bottom: 10px; }
          h1 { color: ${corGeral}; margin: 0; font-size: 22px; }
          .sub { color: #6b7280; font-size: 12px; }
          
          .profile { display: flex; gap: 20px; background: #f8fafc; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px; }
          .info { flex: 1; }
          .info h2 { margin: 0 0 5px 0; font-size: 20px; }
          .stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-top: 10px; }
          .stat-item { font-size: 12px; }
          .stat-label { font-weight: bold; color: #64748b; text-transform: uppercase; font-size: 10px; }
          
          .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; background: ${corGeral}; color: white; font-weight: bold; font-size: 12px; float: right; }
          
          @media print { .no-print { display: none; } body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Relatório Técnico Unificado</h1>
          <div class="sub">${
            competicao?.nome || "Evento TRIF"
          } • Gerado em ${new Date().toLocaleString("pt-BR")}</div>
        </div>

        <div class="profile">
          ${imgHtml}
          <div class="info">
            <span class="badge">${textoStatus}</span>
            <h2>${classeIcon} ${nomeRobo}</h2>
            <div style="font-size: 13px; color: #4b5563; margin-bottom: 8px;">${
              robo?.equipe || "Sem equipe"
            }</div>
            
            <div class="stats">
              <div class="stat-item"><div class="stat-label">Classe</div>${
                robo?.classe || "-"
              }</div>
              <div class="stat-item"><div class="stat-label">Peso</div>${
                robo?.peso || 0
              }g</div>
              <div class="stat-item"><div class="stat-label">Pontuação</div>${
                robo?.pontos || 0
              } pts</div>
            </div>
            ${
              robo?.descricao
                ? `<div style="margin-top:8px; font-size:11px; font-style:italic; color:#6b7280;">"${robo.descricao}"</div>`
                : ""
            }
          </div>
        </div>

        <h3 style="font-size: 16px; border-bottom: 1px solid #eee; padding-bottom: 5px;">Histórico de Verificações</h3>
        ${htmlChecklists}

        <script>
          window.onload = () => setTimeout(() => window.print(), 500);
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  },
};

// ==========================================
// 4. Módulo de Formulário de Inspeção
// ==========================================
const Inspecao = {
  itensChecklist: {
    estatica: [
      {
        titulo: "Dispositivo de suspensão",
        desc: "Robô pode ser suspenso sem tocar rodas na bancada",
      },
      {
        titulo: "Isolamento elétrico",
        desc: "Fiação e terminais devidamente isolados",
      },
      {
        titulo: "Proteção de partes afiadas",
        desc: "Estrutura protege partes cortantes",
      },
      { titulo: "Chave geral", desc: "ON/OFF claramente identificado" },
      {
        titulo: "Indicador de alimentação",
        desc: "LED/Lâmpada visível quando ligado",
      },
      { titulo: "Trava de arma", desc: "Sistema de travamento da arma" },
      { titulo: "Bateria", desc: "Bateria adequada e carregador específico" },
      { titulo: "LiPo Sack", desc: "Para baterias LiPo (se aplicável)" },
      {
        titulo: "Sistemas pneumáticos/hidráulicos",
        desc: "Conformidade com regulamentação",
      },
      {
        titulo: "Ausência de vazamentos",
        desc: "Sem vazamentos visíveis ou audíveis",
      },
    ],
    dinamica: [
      {
        titulo: "Verificação de peso",
        desc: "Peso dentro dos limites da classe",
      },
      { titulo: "Sistema de transmissão", desc: "Sem interferência no sinal" },
      {
        titulo: "Locomoção controlada",
        desc: "Atravessa arena em menos de 1 minuto",
      },
      {
        titulo: "Teste de fail-safe",
        desc: "Arma e locomoção param com perda de sinal",
      },
      {
        titulo: "Teste da trava de segurança",
        desc: "Trava funciona corretamente",
      },
      {
        titulo: "Tempo de parada da arma",
        desc: "Para completamente em menos de 60 segundos",
      },
    ],
  },

  render() {
    DOM.clear("#content");
    const content = document.getElementById("content");
    const section = DOM.create("section", { className: "section" });
    section.appendChild(DOM.createTitle("Nova Inspeção"));

    const robos = dataManager.getRobos();
    const robosList = Object.keys(robos);

    if (robosList.length === 0) {
      section.innerHTML +=
        '<p style="color: #ef4444;">⚠️ Nenhum robô cadastrado.</p>';
      content.appendChild(section);
      return;
    }

    section.innerHTML += `
      <div class="form-grid">
        <div>
          <label>Robô:</label>
          <select id="inspecaoRobo">
            ${robosList
              .map(
                (nome) =>
                  `<option value="${DOM.escape(nome)}">${DOM.escape(
                    nome
                  )}</option>`
              )
              .join("")}
          </select>
        </div>
        <div>
          <label>Tipo de Inspeção:</label>
          <select id="inspecaoTipo">
            <option value="estatica">Inspeção Estática</option>
            <option value="dinamica">Inspeção Dinâmica</option>
          </select>
        </div>
      </div>
      <div id="listaChecklist" style="margin-top: 20px;"></div>
      <button id="btnSalvarRelatorio" class="btn-save" style="margin-top: 20px; width: 100%;">Gerar Relatório</button>
    `;

    content.appendChild(section);

    setTimeout(() => {
      document.getElementById("inspecaoTipo").onchange = () =>
        this.renderItens();
      document.getElementById("btnSalvarRelatorio").onclick = () =>
        this.salvarRelatorio();
      this.renderItens();
    }, 0);
  },

  renderItens() {
    const tipo = document.getElementById("inspecaoTipo").value;
    const container = document.getElementById("listaChecklist");
    container.innerHTML = "";

    const itens = this.itensChecklist[tipo];

    itens.forEach((item) => {
      const div = DOM.create("div", {
        className: "inspection-item",
        style: {
          background: "#f9f9f9",
          padding: "15px",
          marginBottom: "12px",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
        },
      });

      div.innerHTML = `
        <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 10px;">
          <p style="margin: 0 0 4px 0; font-weight: 700; color: #1f2937;">${DOM.escape(
            item.titulo
          )}</p>
          <small style="color: #6b7280; display: block;">${DOM.escape(
            item.desc
          )}</small>
        </div>
        <div class="inspection-controls">
          <select class="status-select" data-titulo="${DOM.escape(
            item.titulo
          )}">
            <option value="aprovado">✅ Aprovado</option>
            <option value="reprovado">❌ Reprovado</option>
          </select>
          <input type="text" class="obs-input" placeholder="Observações (opcional)">
        </div>
      `;
      container.appendChild(div);
    });
  },

  salvarRelatorio() {
    try {
      const robo = document.getElementById("inspecaoRobo").value;
      const tipo = document.getElementById("inspecaoTipo").value;
      Validators.required(robo, "Robô");

      const cards = document.querySelectorAll("#listaChecklist > div");
      const resultados = [];

      cards.forEach((div) => {
        const select = div.querySelector(".status-select");
        const titulo = select.dataset.titulo;
        const status = select.value;
        const obs = div.querySelector(".obs-input").value.trim();
        resultados.push({ titulo, status, obs });
      });

      const relatorio = {
        robo,
        tipo: tipo === "estatica" ? "Estática" : "Dinâmica",
        resultados,
      };

      dataManager.addRelatorio(relatorio);
      toast.success("Relatório salvo!");
      setTimeout(() => Relatorios.render(), 500);
    } catch (error) {
      toast.error(error.message);
    }
  },
};

// Exporta módulos
window.TabelaDano = TabelaDano;
window.Ranking = Ranking;
window.Relatorios = Relatorios;
window.Inspecao = Inspecao;
