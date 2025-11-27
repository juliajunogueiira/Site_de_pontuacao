// dashboard.js - Módulo de Dashboard (Admin e Staff) - COM EXPORT PDF

const Dashboard = {
  render() {
    DOM.clear("#content");
    const content = document.getElementById("content");

    // Seção de Competição
    content.appendChild(this.renderCompeticaoSection());

    // Seção de Cadastro de Robô
    content.appendChild(this.renderRoboSection());

    // Seção de Lista de Robôs
    const robos = dataManager.getRobos();
    if (Object.keys(robos).length > 0) {
      content.appendChild(this.renderRobosListSection(robos));
    }
  },

  renderCompeticaoSection() {
    const section = DOM.create("section", { className: "section" });
    section.appendChild(DOM.createTitle("Informações da Competição"));

    const competicao = dataManager.getCompeticao();

    const formGrid = DOM.create("div", { className: "form-grid" });
    formGrid.innerHTML = `
      <div class="full">
        <label>Nome da Competição:</label>
        <input type="text" id="compNome" value="${DOM.escape(
          competicao?.nome || ""
        )}" placeholder="Ex: TRIF 2025 - 6ª Edição">
      </div>
      <div class="full">
        <label>Local:</label>
        <input type="text" id="compLocal" value="${DOM.escape(
          competicao?.local || ""
        )}" placeholder="Ex: IFSP - Campus São Paulo">
      </div>
      <div class="full">
        <label>Data:</label>
        <input type="date" id="compData" value="${competicao?.data || ""}">
      </div>
      <div class="full">
        <label>Descrição:</label>
        <textarea id="compDesc" rows="3" placeholder="Descrição do evento...">${DOM.escape(
          competicao?.descricao || ""
        )}</textarea>
      </div>
      <div class="full" style="display: flex; justify-content: flex-end; gap: 10px;">
        <button id="btnLimparCompeticao" class="btn-edit">Limpar Campos</button>
        <button id="btnSalvarCompeticao" class="btn-save">Salvar Competição</button>
      </div>
    `;

    section.appendChild(formGrid);

    // Adiciona seção de gerenciamento do sistema (apenas Admin)
    const session = authService.getSession();
    if (session && session.role === "admin") {
      const adminSection = DOM.create("div", {
        style: {
          marginTop: "30px",
          padding: "20px",
          background: "#fef2f2",
          border: "2px solid #fca5a5",
          borderRadius: "10px",
        },
      });

      adminSection.innerHTML = `
        <h4 style="margin: 0 0 12px 0; color: #991b1b;">⚙️ Gerenciamento do Sistema</h4>
        <p style="margin: 0 0 12px 0; color: #7f1d1d; font-size: 14px;">
          <strong>Atenção:</strong> Estas ações são irreversíveis e afetam todo o sistema.
        </p>
        <div style="display: flex; gap: 10px;">
          <button id="btnLimparSistemaAdmin" class="btn-danger" style="flex: 1;">
            🗑️ Limpar Todo o Sistema
          </button>
          <button id="btnExportarDados" class="btn-edit" style="flex: 1;">
            💾 Exportar Dados
          </button>
        </div>
      `;

      section.appendChild(adminSection);
    }

    // Event listeners
    setTimeout(() => {
      document.getElementById("btnLimparCompeticao").onclick = () =>
        this.limparCompeticao();
      document.getElementById("btnSalvarCompeticao").onclick = () =>
        this.salvarCompeticao();

      if (session && session.role === "admin") {
        document.getElementById("btnLimparSistemaAdmin").onclick = () =>
          this.limparSistemaCompleto();
        document.getElementById("btnExportarDados").onclick = () =>
          this.exportarDados();
      }
    }, 0);

    return section;
  },

  renderRoboSection() {
    const section = DOM.create("section", { className: "section" });
    section.appendChild(DOM.createTitle("Cadastro de Robô"));

    const formGrid = DOM.create("div", { className: "form-grid" });
    formGrid.innerHTML = `
      <div>
        <label>Nome do Robô:</label>
        <input type="text" id="roboNome" placeholder="Ex: Destruidor 3000" required>
      </div>
      <div>
        <label>Equipe:</label>
        <input type="text" id="roboEquipe" placeholder="Nome da equipe">
      </div>
      <div>
        <label>Classe:</label>
        <select id="roboClasse">
          <option value="">Selecione a classe</option>
          <option value="Ant">🐜 Ant (até 150g)</option>
          <option value="Cupim">🪲 Cupim (até 3kg)</option>
        </select>
      </div>
      <div>
        <label>Peso (g):</label>
        <input type="number" id="roboPeso" placeholder="3000" min="0">
      </div>
      <div class="full">
        <label>Descrição:</label>
        <textarea id="roboDesc" rows="2" placeholder="Descrição do robô..."></textarea>
      </div>
      <div class="full">
        <label>Foto:</label>
        <input type="file" id="roboFoto" accept="image/*">
      </div>
      <div class="full" style="display: flex; justify-content: flex-end; gap: 10px;">
        <button id="btnLimparRobo" class="btn-edit">Limpar Campos</button>
        <button id="btnSalvarRobo" class="btn-save">Salvar Robô</button>
      </div>
    `;

    section.appendChild(formGrid);

    // Event listeners
    setTimeout(() => {
      document.getElementById("btnLimparRobo").onclick = () =>
        this.limparRobo();
      document.getElementById("btnSalvarRobo").onclick = () =>
        this.salvarRobo();
    }, 0);

    return section;
  },

  renderRobosListSection(robos) {
    const section = DOM.create("section", { className: "section" });
    section.appendChild(DOM.createTitle("Robôs Cadastrados"));

    let tableHtml = `
      <table>
        <thead>
          <tr>
            <th>Foto</th>
            <th>Nome</th>
            <th>Classe</th>
            <th>Peso</th>
            <th>Pontos</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
    `;

    Object.entries(robos).forEach(([nome, robo]) => {
      const img = robo.fotoBase64
        ? `<img src="${robo.fotoBase64}" class="robo-thumb" alt="${DOM.escape(
            nome
          )}">`
        : `<div class="robo-thumb-placeholder">SF</div>`;

      const classeIcon =
        robo.classe === "Ant" ? "🐜" : robo.classe === "Cupim" ? "🪲" : "";

      tableHtml += `
        <tr>
          <td>${img}</td>
          <td>
            <strong>${DOM.escape(nome)}</strong><br>
            <small style="color: #6b7280;">${DOM.escape(
              robo.equipe || "Sem equipe"
            )}</small>
          </td>
          <td>${classeIcon} ${DOM.escape(robo.classe || "-")}</td>
          <td>${robo.peso || 0}g</td>
          <td><strong>${Formatters.number(robo.pontos, 1)}</strong></td>
          <td>
            <div style="display: flex; gap: 6px; flex-wrap: wrap; justify-content: center;">
              <button onclick="Dashboard.editarRobo('${DOM.escape(
                nome
              )}')" class="btn-edit" style="padding: 6px 10px; font-size: 12px;">✏️ Editar</button>
              <button onclick="Dashboard.excluirRobo('${DOM.escape(
                nome
              )}')" class="btn-danger" style="padding: 6px 10px; font-size: 12px;">🗑️ Excluir</button>
              <button onclick="Dashboard.exportarRoboPDF('${DOM.escape(
                nome
              )}')" class="btn-save" style="padding: 6px 10px; font-size: 12px;">📄 PDF</button>
            </div>
          </td>
        </tr>
      `;
    });

    tableHtml += `</tbody></table>`;
    section.innerHTML += tableHtml;

    return section;
  },

  limparCompeticao() {
    document.getElementById("compNome").value = "";
    document.getElementById("compLocal").value = "";
    document.getElementById("compData").value = "";
    document.getElementById("compDesc").value = "";
    toast.info("Campos limpos");
  },

  salvarCompeticao() {
    try {
      const dados = {
        nome: document.getElementById("compNome").value.trim(),
        local: document.getElementById("compLocal").value.trim(),
        data: document.getElementById("compData").value,
        descricao: document.getElementById("compDesc").value.trim(),
      };

      Validators.required(dados.nome, "Nome da competição");

      dataManager.saveCompeticao(dados);
      toast.success("Competição salva com sucesso!");
    } catch (error) {
      toast.error(error.message);
    }
  },

  limparRobo() {
    document.getElementById("roboNome").value = "";
    document.getElementById("roboEquipe").value = "";
    document.getElementById("roboClasse").value = "";
    document.getElementById("roboPeso").value = "";
    document.getElementById("roboDesc").value = "";
    document.getElementById("roboFoto").value = "";
    toast.info("Campos limpos");
  },

  async salvarRobo() {
    try {
      const nome = document.getElementById("roboNome").value.trim();
      Validators.required(nome, "Nome do robô");

      const fileInput = document.getElementById("roboFoto");
      const foto64 = await this.processarFoto(fileInput);

      const roboExistente = dataManager.getRobo(nome);

      const dados = {
        equipe: document.getElementById("roboEquipe").value.trim(),
        classe: document.getElementById("roboClasse").value.trim(),
        peso: document.getElementById("roboPeso").value,
        descricao: document.getElementById("roboDesc").value.trim(),
        fotoBase64: foto64 || roboExistente?.fotoBase64 || null,
      };

      dataManager.addRobo(nome, dados);

      toast.success(
        roboExistente
          ? `Robô "${nome}" atualizado!`
          : `Robô "${nome}" cadastrado!`
      );

      this.limparRobo();
      this.render();
    } catch (error) {
      toast.error(error.message);
    }
  },

  processarFoto(fileInput) {
    return new Promise((resolve, reject) => {
      if (!fileInput.files[0]) {
        resolve(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error("Erro ao processar imagem"));
      reader.readAsDataURL(fileInput.files[0]);
    });
  },

  editarRobo(nome) {
    const robo = dataManager.getRobo(nome);
    if (!robo) {
      toast.error("Robô não encontrado");
      return;
    }

    document.getElementById("roboNome").value = nome;
    document.getElementById("roboEquipe").value = robo.equipe || "";
    document.getElementById("roboClasse").value = robo.classe || "";
    document.getElementById("roboPeso").value = robo.peso || "";
    document.getElementById("roboDesc").value = robo.descricao || "";

    toast.info("Dados carregados. Edite e clique em Salvar.");

    document
      .getElementById("roboNome")
      .scrollIntoView({ behavior: "smooth", block: "center" });
    document.getElementById("roboNome").focus();
  },

  async excluirRobo(nome) {
    if (await Confirm.delete(nome)) {
      dataManager.deleteRobo(nome);
      toast.success(`Robô "${nome}" excluído`);
      this.render();
    }
  },

  exportarRoboPDF(nome) {
    const robo = dataManager.getRobo(nome);
    if (!robo) {
      toast.error("Robô não encontrado");
      return;
    }

    const competicao = dataManager.getCompeticao();

    // Cria janela para impressão
    const printWindow = window.open("", "_blank");

    const classeIcon =
      robo.classe === "Ant" ? "🐜" : robo.classe === "Cupim" ? "🪲" : "";
    const imagemHtml = robo.fotoBase64
      ? `<img src="${robo.fotoBase64}" style="max-width: 200px; max-height: 200px; border-radius: 8px; border: 2px solid #e5e7eb;">`
      : '<div style="width: 200px; height: 200px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; border-radius: 8px; border: 2px solid #e5e7eb; font-size: 48px; color: #9ca3af;">📷</div>';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Ficha - ${nome}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            padding: 40px;
            background: white;
            color: #1f2937;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #10b981;
          }
          .header h1 {
            color: #10b981;
            font-size: 28px;
            margin-bottom: 8px;
          }
          .header p {
            color: #6b7280;
            font-size: 14px;
          }
          .robo-card {
            background: #f9fafb;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 20px;
          }
          .robo-header {
            display: flex;
            gap: 30px;
            margin-bottom: 30px;
            align-items: center;
          }
          .robo-info {
            flex: 1;
          }
          .robo-nome {
            font-size: 32px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 12px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            margin-top: 20px;
          }
          .info-item {
            background: white;
            padding: 16px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
          }
          .info-label {
            font-size: 12px;
            color: #6b7280;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 6px;
          }
          .info-value {
            font-size: 18px;
            font-weight: 700;
            color: #1f2937;
          }
          .descricao-section {
            margin-top: 20px;
            padding: 20px;
            background: white;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
          }
          .descricao-section h3 {
            font-size: 16px;
            color: #1f2937;
            margin-bottom: 12px;
          }
          .descricao-section p {
            color: #4b5563;
            line-height: 1.6;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🤖 Ficha Técnica do Robô</h1>
          <p>${competicao?.nome || "TRIF 2025"} ${
      competicao?.local ? "• " + competicao.local : ""
    }</p>
        </div>

        <div class="robo-card">
          <div class="robo-header">
            ${imagemHtml}
            <div class="robo-info">
              <div class="robo-nome">${classeIcon} ${nome}</div>
              <p style="color: #6b7280; font-size: 16px;">${
                robo.equipe || "Equipe não informada"
              }</p>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Classe</div>
              <div class="info-value">${classeIcon} ${
      robo.classe || "Não informada"
    }</div>
            </div>
            <div class="info-item">
              <div class="info-label">Peso</div>
              <div class="info-value">${robo.peso || 0}g</div>
            </div>
            <div class="info-item">
              <div class="info-label">Pontuação Acumulada</div>
              <div class="info-value" style="color: #10b981;">${Formatters.number(
                robo.pontos,
                1
              )} pts</div>
            </div>
            <div class="info-item">
              <div class="info-label">Data de Cadastro</div>
              <div class="info-value">${
                robo.criadoEm
                  ? Formatters.dateShort(robo.criadoEm)
                  : "Não informada"
              }</div>
            </div>
          </div>

          ${
            robo.descricao
              ? `
            <div class="descricao-section">
              <h3>📝 Descrição</h3>
              <p>${robo.descricao}</p>
            </div>
          `
              : ""
          }
        </div>

        <div class="footer">
          <p>Documento gerado em ${new Date().toLocaleString("pt-BR")}</p>
          <p style="margin-top: 8px;">Sistema de Gerenciamento TRIF 2025</p>
        </div>

        <script>
          window.onload = function() {
            setTimeout(() => {
              window.print();
            }, 500);
          }
        </script>
      </body>
      </html>
    `);

    printWindow.document.close();
  },

  async limparSistemaCompleto() {
    const mensagem =
      `⚠️ ATENÇÃO CRÍTICA - ADMINISTRADOR ⚠️\n\n` +
      `Esta ação irá APAGAR PERMANENTEMENTE:\n\n` +
      `• Todos os robôs cadastrados\n` +
      `• Todas as partidas (em andamento e finalizadas)\n` +
      `• Todo o histórico de julgamentos\n` +
      `• Todos os relatórios de inspeção\n` +
      `• Todas as informações da competição\n` +
      `• Todo o ranking\n\n` +
      `🚨 ESTA AÇÃO NÃO PODE SER DESFEITA! 🚨\n\n` +
      `Digite "APAGAR TUDO" para confirmar:`;

    const confirmacao = prompt(mensagem);

    if (confirmacao === "APAGAR TUDO") {
      if (dataManager.clearAllData()) {
        toast.success(
          "Sistema completamente limpo! Todos os dados foram apagados.",
          5000
        );

        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } else if (confirmacao !== null) {
      toast.info("Operação cancelada. Digite 'APAGAR TUDO' para confirmar.");
    }
  },

  exportarDados() {
    try {
      const dados = {
        competicao: dataManager.getCompeticao(),
        robos: dataManager.getRobos(),
        partidas: dataManager.getPartidas(),
        relatorios: dataManager.getRelatorios(),
        exportadoEm: new Date().toISOString(),
        versao: "TRIF 2025 v1.0",
      };

      const json = JSON.stringify(dados, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `trif-backup-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Dados exportados com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar dados: " + error.message);
    }
  },
};

window.Dashboard = Dashboard;
