// ============================================
// ARQUIVO: combate-staff.js - CORRIGIDO PARA 1 ROUND
// Exibe qual jurado deve definir o dano
// ============================================

const CombateStaff = {
  intervalId: null,
  ultimaPartidaId: null,

  render() {
    this.clearInterval();
    DOM.clear("#content");
    const content = document.getElementById("content");

    const section = DOM.create("section", { className: "section" });
    section.appendChild(DOM.createTitle("⚔️ Arena - Controle do Combate"));

    const robos = dataManager.getRobos();
    const robosList = Object.keys(robos);

    if (robosList.length < 2) {
      section.innerHTML += `
        <div style="background: #fef2f2; border: 2px solid #fca5a5; border-radius: 10px; padding: 20px; text-align: center;">
          <p style="margin: 0; color: #991b1b; font-weight: 600;">
            ⚠️ É necessário ter pelo menos 2 robôs cadastrados para iniciar um combate.
          </p>
        </div>
      `;
      content.appendChild(section);
      return;
    }

    section.innerHTML += `
      <div id="setupCombate" style="background: #f9fafb; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
        <h4 style="margin: 0 0 16px 0; color: #1f2937;">🤖 Configuração da Partida</h4>
        
        <div class="form-grid">
          <div>
            <label>🤖 Robô 1:</label>
            <select id="robo1">
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
            <label>🤖 Robô 2:</label>
            <select id="robo2">
              ${robosList
                .map(
                  (nome, i) =>
                    `<option value="${DOM.escape(nome)}" ${
                      i === 1 ? "selected" : ""
                    }>${DOM.escape(nome)}</option>`
                )
                .join("")}
            </select>
          </div>
        </div>

        <div style="background: #eff6ff; border: 2px solid #93c5fd; border-radius: 10px; padding: 16px; margin: 20px 0;">
          <h4 style="margin: 0 0 12px 0; color: #1e40af;">⚖️ Novo Processo de Julgamento (1 ROUND)</h4>
          <p style="margin: 0; font-size: 14px; color: #1e3a8a; line-height: 1.6;">
            📋 <strong>Como funciona:</strong><br>
            1. Staff inicia a partida<br>
            2. <strong>Todos os 3 jurados julgam a AGRESSIVIDADE</strong> da rodada única<br>
            3. <strong>O ÚLTIMO jurado a completar</strong> receberá a função de definir o dano<br>
            4. Os jurados conversam fisicamente e decidem o dano<br>
            5. <strong>O último jurado</strong> registra o dano consensual no sistema<br>
            6. O sistema aplica o dano e finaliza a partida
          </p>
        </div>

        <div style="display: flex; gap: 10px; margin-top: 16px;">
          <button id="btnIniciar" class="btn-save" style="flex: 1;">🚀 Iniciar Nova Partida</button>
          <button id="btnAtualizar" class="btn-edit">🔄 Atualizar Placar</button>
          <button id="btnLimparDados" class="btn-danger" title="Apagar TODOS os dados do sistema">🗑️ Limpar Sistema</button>
        </div>
      </div>

      <div id="placarContainer"></div>
      <div id="historicoContainer"></div>
      <div id="historicoPartidasAnteriores" style="margin-top: 30px;"></div>
    `;

    content.appendChild(section);

    // Aguarda renderização completa
    setTimeout(() => {
      this.setupEventListeners();
      this.atualizarPlacar();
      this.renderHistoricoPartidas();
      this.startAutoUpdate();
    }, 100);
  },

  setupEventListeners() {
    const btnIniciar = document.getElementById("btnIniciar");
    const btnAtualizar = document.getElementById("btnAtualizar");
    const btnLimparDados = document.getElementById("btnLimparDados");

    if (btnIniciar) btnIniciar.onclick = () => this.iniciarPartida();
    if (btnAtualizar) btnAtualizar.onclick = () => this.atualizarPlacar();
    if (btnLimparDados) btnLimparDados.onclick = () => this.limparSistema();
  },

  async iniciarPartida() {
    try {
      const robo1 = document.getElementById("robo1")?.value;
      const robo2 = document.getElementById("robo2")?.value;

      if (!robo1 || !robo2) {
        throw new Error("Selecione ambos os robôs!");
      }

      if (robo1 === robo2) {
        throw new Error("Selecione robôs diferentes!");
      }

      const partida = dataManager.createPartida(robo1, robo2);
      this.ultimaPartidaId = partida.id;

      console.log("✅ Partida criada:", partida);

      toast.success(
        `✅ Partida #${partida.id} iniciada!\n\n` +
          `🤖 ${robo1} vs ${robo2}\n\n` +
          `📋 FLUXO:\n` +
          `1️⃣ Todos os jurados julgam AGRESSIVIDADE\n` +
          `2️⃣ Último jurado a completar define o dano\n` +
          `3️⃣ Sistema aplica o dano e finaliza\n\n` +
          `📢 Informe aos jurados: ID ${partida.id}`,
        8000
      );

      this.atualizarPlacar();
      this.renderHistoricoPartidas();
    } catch (error) {
      toast.error(error.message);
    }
  },

  atualizarPlacar() {
    const placarContainer = document.getElementById("placarContainer");
    const historicoContainer = document.getElementById("historicoContainer");

    if (!placarContainer || !historicoContainer) {
      return;
    }

    const partida = dataManager.getPartidaAtual();

    console.log("📊 Atualizando placar - Partida atual:", partida);

    if (!partida) {
      placarContainer.innerHTML = `
        <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; text-align: center; color: #6b7280;">
          <p style="margin: 0;">Nenhuma partida ativa. Inicie uma nova partida acima.</p>
        </div>
      `;
      historicoContainer.innerHTML = "";
      return;
    }

    let totalR1 = 0;
    let totalR2 = 0;
    let julgamentosAgressividade = 0;

    // DEBUG: Log dos julgamentos
    console.log("🔍 Julgamentos por jurado:");
    ["jurado1", "jurado2", "jurado3"].forEach((jurado) => {
      const julgamentos = partida.julgamentos[jurado] || [];
      console.log(
        `  ${jurado}: ${julgamentos.length} julgamento(s)`,
        julgamentos
      );

      julgamentos.forEach((j) => {
        if (j.pontosAgrR1 !== null && j.pontosAgrR2 !== null) {
          julgamentosAgressividade += 1;
          console.log(
            `    ✓ Agressividade: ${j.pontosAgrR1} x ${j.pontosAgrR2}`
          );
        }

        if (j.pontosR1 !== null && j.pontosR2 !== null) {
          totalR1 += j.pontosR1;
          totalR2 += j.pontosR2;
          console.log(`    ✓ Total (com dano): ${j.pontosR1} x ${j.pontosR2}`);
        }
      });
    });

    console.log(
      `📈 Totais: ${totalR1} x ${totalR2}, Julgamentos: ${julgamentosAgressividade}/3`
    );

    let statusText = "⚡ Julgando Agressividade";
    let statusColor = "#3b82f6";

    if (partida.status === "finalizada") {
      statusText = "🏆 Partida Finalizada!";
      statusColor = "#10b981";
    } else if (partida.status === "aguardando_dano") {
      statusText = `⏳ Aguardando Jurado ${partida.juradoResponsavelDano} definir dano`;
      statusColor = "#f59e0b";
    }

    let progressoHtml = "";
    if (partida.status === "aguardando_agressividade") {
      progressoHtml = `
        <div style="margin-top: 12px; padding: 12px; background: rgba(59, 130, 246, 0.2); border: 2px solid #3b82f6; border-radius: 8px;">
          <p style="margin: 0; font-weight: 700; font-size: 14px; color: #1e40af;">
            ⚡ Julgamentos de Agressividade: ${julgamentosAgressividade}/3
          </p>
          <div style="background: rgba(255,255,255,0.5); height: 8px; border-radius: 4px; margin-top: 8px; overflow: hidden;">
            <div style="background: #3b82f6; height: 100%; width: ${
              (julgamentosAgressividade / 3) * 100
            }%; transition: width 0.3s;"></div>
          </div>
        </div>
      `;
    } else if (partida.status === "aguardando_dano") {
      progressoHtml = `
        <div style="margin-top: 12px; padding: 12px; background: rgba(251, 191, 36, 0.2); border: 2px solid #f59e0b; border-radius: 8px;">
          <p style="margin: 0; font-weight: 700; font-size: 14px; color: #92400e;">
            ✓ Todos julgaram a agressividade (3/3)<br>
            🎯 <strong>Jurado ${partida.juradoResponsavelDano}</strong> foi o último a completar<br>
            ⏳ Aguardando definição do dano consensual
          </p>
        </div>
      `;
    } else if (partida.status === "finalizada") {
      progressoHtml = `
        <div style="margin-top: 12px; padding: 12px; background: rgba(16, 185, 129, 0.2); border: 2px solid #10b981; border-radius: 8px;">
          <p style="margin: 0 0 8px 0; font-weight: 700; font-size: 14px; color: #065f46;">
            ✅ Dano Consensual: ${partida.danoConsensual?.danoR1 || 0} vs ${
        partida.danoConsensual?.danoR2 || 0
      }<br>
            👤 Definido por: Jurado ${partida.juradoResponsavelDano}
          </p>
          <div style="display: flex; gap: 16px; justify-content: center; font-size: 13px; color: #047857;">
            <span>${DOM.escape(partida.robo1)}: ${
        partida.danoConsensual?.pontosDanoR1 || 0
      } pts</span>
            <span>${DOM.escape(partida.robo2)}: ${
        partida.danoConsensual?.pontosDanoR2 || 0
      } pts</span>
          </div>
        </div>
      `;
    }

    placarContainer.innerHTML = `
      <div class="placar-box" style="border: 4px solid ${statusColor};">
        <h3>${statusText}</h3>
        <p style="margin: 0; opacity: 0.9;">ID da Partida: <strong style="font-size: 28px; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 6px;">#${
          partida.id
        }</strong></p>
        
        ${progressoHtml}
        
        <div class="placar-scores">
          <div class="placar-score">
            <div class="name">🤖 ${DOM.escape(partida.robo1)}</div>
            <div class="points">${totalR1}</div>
          </div>
          <div style="display: flex; align-items: center; font-size: 32px;">VS</div>
          <div class="placar-score">
            <div class="name">🤖 ${DOM.escape(partida.robo2)}</div>
            <div class="points">${totalR2}</div>
          </div>
        </div>

        ${
          partida.status === "finalizada"
            ? `
          <div style="margin-top: 20px; padding: 16px; background: rgba(255,255,255,0.2); border-radius: 8px;">
            <p style="margin: 0; font-size: 18px; font-weight: 700;">
              🏆 Vencedor: ${DOM.escape(partida.resultado.vencedor)}
            </p>
          </div>
        `
            : ""
        }
      </div>
    `;

    this.renderHistorico(partida, historicoContainer);
  },

  renderHistorico(partida, container) {
    if (!container) return;

    let html = `
      <div style="background: white; padding: 20px; border-radius: 10px; margin-top: 20px; border: 1px solid #e5e7eb;">
        <h4 style="margin: 0 0 16px 0; color: #1f2937;">📊 Detalhamento por Jurado</h4>
    `;

    ["jurado1", "jurado2", "jurado3"].forEach((jurado, idx) => {
      const julgamentos = partida.julgamentos[jurado] || [];
      const temJulgamentos = julgamentos.length > 0;
      const juradoNum = idx + 1;

      const isResponsavel = partida.juradoResponsavelDano === juradoNum;
      const responsavelBadge = isResponsavel
        ? ' <span style="background: #f59e0b; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-left: 8px;">🎯 DEFINE DANO</span>'
        : "";

      html += `
        <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid ${
          temJulgamentos ? "#3b82f6" : "#d1d5db"
        };">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <strong style="font-size: 16px;">Jurado ${juradoNum}${responsavelBadge}</strong>
            <span style="color: ${
              temJulgamentos ? "#3b82f6" : "#6b7280"
            }; font-weight: 600;">
              ${julgamentos.length}/1 rodada
            </span>
          </div>
      `;

      if (temJulgamentos) {
        const j = julgamentos[0];
        const finalizado = j.pontosR1 !== null && j.pontosR2 !== null;
        const temDano = j.pontosDanoR1 !== null && j.pontosDanoR2 !== null;

        html += `
          <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid ${
            finalizado ? "#86efac" : "#93c5fd"
          };">
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 6px;">Rodada 1</div>
            ${
              finalizado
                ? `
              <div style="font-size: 14px;">
                <div><strong>${DOM.escape(partida.robo1)}:</strong> ${
                    j.pontosR1
                  } pts</div>
                <div style="font-size: 11px; color: #6b7280;">Dano: ${
                  j.pontosDanoR1 || 0
                } + Agr: ${j.pontosAgrR1 || 0}</div>
                <div style="margin-top: 6px;"><strong>${DOM.escape(
                  partida.robo2
                )}:</strong> ${j.pontosR2} pts</div>
                <div style="font-size: 11px; color: #6b7280;">Dano: ${
                  j.pontosDanoR2 || 0
                } + Agr: ${j.pontosAgrR2 || 0}</div>
              </div>
            `
                : `
              <div style="font-size: 13px;">
                <div style="color: #3b82f6; font-weight: 600;">⚡ Agressividade:</div>
                <div style="font-size: 16px; font-weight: 700; margin: 4px 0;">
                  ${j.pontosAgrR1 || 0} x ${j.pontosAgrR2 || 0}
                </div>
                <div style="color: #f59e0b; font-weight: 600; margin-top: 4px;">
                  ${
                    temDano
                      ? "✅ Dano: " + j.pontosDanoR1 + " x " + j.pontosDanoR2
                      : "⏳ Aguardando dano..."
                  }
                </div>
              </div>
            `
            }
          </div>
        `;
      } else {
        html += `<p style="margin: 0; color: #9ca3af; font-size: 14px;">Nenhum julgamento ainda</p>`;
      }

      html += `</div>`;
    });

    html += `</div>`;
    container.innerHTML = html;
  },

  renderHistoricoPartidas() {
    const container = document.getElementById("historicoPartidasAnteriores");
    if (!container) return;

    const todasPartidas = dataManager.getPartidas();
    const partidasFinalizadas = todasPartidas.filter(
      (p) => p.status === "finalizada"
    );

    if (partidasFinalizadas.length === 0) {
      container.innerHTML = "";
      return;
    }

    let html = `
      <div style="background: white; padding: 20px; border-radius: 10px; border: 1px solid #e5e7eb;">
        <h4 style="margin: 0 0 16px 0; color: #1f2937;">📋 Histórico de Partidas Finalizadas</h4>
        <div style="display: flex; flex-direction: column; gap: 12px;">
    `;

    const partidasOrdenadas = [...partidasFinalizadas].reverse();

    partidasOrdenadas.forEach((partida) => {
      const vencedor = partida.resultado.vencedor;
      const isRobo1Vencedor = vencedor === partida.robo1;

      html += `
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; display: flex; justify-content: space-between; align-items: center; gap: 16px;">
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
              <strong style="font-size: 18px; color: #1f2937; background: #f3f4f6; padding: 6px 12px; border-radius: 6px;">#${
                partida.id
              }</strong>
              <span style="font-size: 13px; color: #6b7280;">${Formatters.date(
                partida.criadaEm
              )}</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 12px; align-items: center;">
              <div style="text-align: right;">
                <div style="font-weight: ${
                  isRobo1Vencedor ? "700" : "400"
                }; color: ${isRobo1Vencedor ? "#10b981" : "#6b7280"};">
                  ${isRobo1Vencedor ? "🏆 " : ""}${DOM.escape(partida.robo1)}
                </div>
                <div style="font-size: 20px; font-weight: 700; color: ${
                  isRobo1Vencedor ? "#10b981" : "#6b7280"
                };">
                  ${partida.resultado.pontosR1}
                </div>
              </div>
              <div style="font-size: 18px; font-weight: 700; color: #9ca3af;">VS</div>
              <div style="text-align: left;">
                <div style="font-weight: ${
                  !isRobo1Vencedor ? "700" : "400"
                }; color: ${!isRobo1Vencedor ? "#10b981" : "#6b7280"};">
                  ${!isRobo1Vencedor ? "🏆 " : ""}${DOM.escape(partida.robo2)}
                </div>
                <div style="font-size: 20px; font-weight: 700; color: ${
                  !isRobo1Vencedor ? "#10b981" : "#6b7280"
                };">
                  ${partida.resultado.pontosR2}
                </div>
              </div>
            </div>
          </div>
          <button 
            onclick="CombateStaff.confirmarExclusaoPartida('${partida.id}')" 
            class="btn-danger" 
            style="padding: 8px 12px; font-size: 13px; white-space: nowrap;"
            title="Excluir esta partida"
          >
            🗑️ Excluir
          </button>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    container.innerHTML = html;
  },

  async confirmarExclusaoPartida(partidaId) {
    const partida = dataManager.getPartida(partidaId);

    if (!partida) {
      toast.error("Partida não encontrada");
      return;
    }

    const mensagem =
      `Tem certeza que deseja excluir esta partida?\n\n` +
      `${partida.robo1} vs ${partida.robo2}\n` +
      `Resultado: ${partida.resultado.pontosR1} x ${partida.resultado.pontosR2}\n\n` +
      `⚠️ ATENÇÃO: Os pontos desta partida serão REMOVIDOS do ranking dos robôs!\n` +
      `Esta ação não pode ser desfeita.`;

    if (await Confirm.ask(mensagem, "Confirmar Exclusão de Partida")) {
      try {
        dataManager.deletePartida(partidaId);
        toast.success(
          "Partida excluída com sucesso! Pontos removidos do ranking."
        );

        this.renderHistoricoPartidas();
        this.atualizarPlacar();
      } catch (error) {
        toast.error(error.message);
      }
    }
  },

  async limparSistema() {
    const mensagem =
      `⚠️ ATENÇÃO CRÍTICA ⚠️\n\n` +
      `Esta ação irá APAGAR PERMANENTEMENTE:\n\n` +
      `• Todos os robôs cadastrados\n` +
      `• Todas as partidas (em andamento e finalizadas)\n` +
      `• Todo o histórico de julgamentos\n` +
      `• Todos os relatórios de inspeção\n` +
      `• Todas as informações da competição\n` +
      `• Todo o ranking\n\n` +
      `🚨 ESTA AÇÃO NÃO PODE SER DESFEITA!  🚨\n\n` +
      `Digite "CONFIRMAR" para prosseguir:`;

    const confirmacao = prompt(mensagem);

    if (confirmacao === "CONFIRMAR") {
      if (dataManager.clearAllData()) {
        toast.success("Sistema limpo! Todos os dados foram apagados.", 5000);

        setTimeout(() => {
          this.render();
        }, 1000);
      }
    } else if (confirmacao !== null) {
      toast.info(
        "Operação cancelada. Digite 'CONFIRMAR' para limpar o sistema."
      );
    }
  },

  startAutoUpdate() {
    console.log("🔄 Iniciando auto-update a cada 3 segundos");
    this.intervalId = setInterval(() => {
      console.log("🔄 Tick - Atualizando placar");
      this.atualizarPlacar();
      this.renderHistoricoPartidas();
    }, 3000);
  },

  clearInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("⏹️ Auto-update parado");
    }
  },

  destroy() {
    this.clearInterval();
  },
};

window.CombateStaff = CombateStaff;
