// ============================================
// ARQUIVO: combate-jurado.js - CORRIGIDO PARA 1 ROUND
// Último jurado a completar agressividade define o dano
// Correção: bugs no seletor de botões de agressividade (espaço extra na classe)
// ============================================

const CombateJurado = {
  partidaAtual: null,
  juradoId: null,

  init() {
    const session = authService.getSession();
    this.juradoId = session.juradoId;
  },

  render() {
    DOM.clear("#content");
    const content = document.getElementById("content");

    const section = DOM.create("section", { className: "section" });

    const session = authService.getSession();
    section.appendChild(
      DOM.createTitle(`Painel de Julgamento - ${session.name}`)
    );

    section.innerHTML += `
      <div style="background: #f0fdf4; border: 2px solid #86efac; border-radius: 10px; padding: 16px; margin-bottom: 20px;">
        <p style="margin: 0 0 12px 0; font-weight: 700; color: #166534;">
          📋 Carregar Partida para Julgamento
        </p>
        <div style="display: flex; gap: 10px;">
          <input 
            type="text" 
            id="partidaId" 
            placeholder="Digite o ID da partida" 
            style="flex: 1;"
          >
          <button id="btnCarregar" class="btn-save">Carregar Partida</button>
        </div>
      </div>
      <div id="formJulgamento"></div>
    `;

    content.appendChild(section);

    setTimeout(() => {
      document.getElementById("btnCarregar").onclick = () =>
        this.carregarPartida();
    }, 0);
  },

  async carregarPartida() {
    try {
      const id = document.getElementById("partidaId").value.trim();
      Validators.required(id, "ID da partida");

      const partida = dataManager.getPartida(id);

      if (!partida) {
        throw new Error("Partida não encontrada");
      }

      if (partida.status === "finalizada") {
        throw new Error("Esta partida já foi finalizada");
      }

      this.partidaAtual = partida;
      this.renderFormularioJulgamento();
      toast.success("Partida carregada com sucesso!");
    } catch (error) {
      toast.error(error.message);
    }
  },

  renderFormularioJulgamento() {
    const form = document.getElementById("formJulgamento");
    form.style.display = "block";

    const juradoKey = `jurado${this.juradoId}`;
    const julgamentosFeitos = this.partidaAtual.julgamentos[juradoKey] || [];

    let html = `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; text-align: center;">
        <h3 style="margin: 0 0 8px 0; color: white;">⚔️ ${DOM.escape(this.partidaAtual.robo1)} vs ${DOM.escape(this.partidaAtual.robo2)}</h3>
        <p style="margin: 0; opacity: 0.9;">ID da Partida: ${this.partidaAtual.id}</p>
      </div>
    `;

    // Verifica se é o jurado responsável por definir o dano
    const isResponsavelDano = dataManager.isJuradoResponsavelDano(
      this.partidaAtual.id, 
      this.juradoId
    );

    // CASO 1: Jurado responsável pelo dano e dano ainda não definido
    if (isResponsavelDano && !this.partidaAtual.danoConsensual) {
      html += this.renderFormularioDefinicaoDano();
    } 
    // CASO 2: Dano já definido - Mostrar dano e permitir visualização
    else if (this.partidaAtual.danoConsensual) {
      html += this.renderDanoFixo();
      html += this.renderRound(julgamentosFeitos, true); // true = modo visualização
    }
    // CASO 3: Aguardando outro jurado definir o dano
    else if (this.partidaAtual.status === "aguardando_dano" && !isResponsavelDano) {
      html += this.renderAguardandoDano();
    }
    // CASO 4: Modo normal - julgar agressividade
    else {
      html += this.renderInfoAgressividade();
      html += this.renderRound(julgamentosFeitos, false); // false = modo julgamento
    }

    form.innerHTML = html;

    // Event listeners
    if (isResponsavelDano && !this.partidaAtual.danoConsensual) {
      setTimeout(() => {
        document.getElementById("btnDefinirDano").onclick = () => this.definirDanoConsensual();
        document.getElementById("danoR1").onchange = () => this.atualizarPreviewDano();
        document.getElementById("danoR2").onchange = () => this.atualizarPreviewDano();
        this.atualizarPreviewDano();
      }, 0);
    } else if (!this.partidaAtual.danoConsensual) {
      setTimeout(() => {
        const btn = document.getElementById(`btnRound_1`);
        if (btn) {
          btn.onclick = () => this.confirmarRound();
        }

        // FIX: remover espaço extra no seletor de classe (". btn-agressividade" -> ".btn-agressividade")
        const selector = document.getElementById(`agressividadeSelector_1`);
        if (selector) {
          selector.querySelectorAll(".btn-agressividade").forEach((btn) => {
            btn.addEventListener("click", () => this.selecionarAgressividade(btn));
          });
        }
      }, 0);
    }
  },

  renderFormularioDefinicaoDano() {
    return `
      <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
        <h4 style="margin: 0 0 12px 0; color: #92400e;">🎯 Você é o Último Jurado - Defina o Dano Consensual</h4>
        <p style="margin: 0 0 16px 0; color: #78350f; font-size: 14px; line-height: 1.6;">
          📋 <strong>Instruções:</strong><br>
          1. Você foi o último a completar a avaliação de agressividade<br>
          2. Converse fisicamente com os outros 2 jurados<br>
          3. Decidam juntos o tipo de dano para cada robô<br>
          4.  Registre a decisão abaixo<br>
          5. Após confirmar, o dano ficará FIXO e a partida será finalizada
        </p>

        <div class="form-grid" style="margin-bottom: 16px;">
          <div>
            <label style="font-weight: 700; color: #92400e;">💥 Dano em ${DOM.escape(this.partidaAtual.robo1)}:</label>
            <select id="danoR1" style="border: 2px solid #f59e0b;">
              ${NIVEIS_DANO.map((nivel) => `<option value="${nivel}">${nivel}</option>`). join("")}
            </select>
          </div>
          <div>
            <label style="font-weight: 700; color: #92400e;">💥 Dano em ${DOM.escape(this.partidaAtual.robo2)}:</label>
            <select id="danoR2" style="border: 2px solid #f59e0b;">
              ${NIVEIS_DANO.map((nivel) => `<option value="${nivel}">${nivel}</option>`).join("")}
            </select>
          </div>
        </div>

        <div id="previewDanoConsensual" style="background: white; padding: 16px; border-radius: 8px; border: 2px solid #fbbf24; margin-bottom: 16px;">
          <p style="margin: 0 0 12px 0; font-weight: 700; color: #1f2937; text-align: center;">
            📊 Preview dos Pontos de Dano
          </p>
          <div style="display: flex; gap: 20px; justify-content: center; align-items: center;">
            <div style="text-align: center;">
              <div style="font-weight: 600; color: #6b7280; margin-bottom: 4px;">${DOM.escape(this.partidaAtual.robo1)}</div>
              <div id="previewPtsR1" style="font-size: 36px; font-weight: 900; color: #10b981;">9</div>
              <small style="color: #6b7280;">pts de dano</small>
            </div>
            <div style="font-size: 24px; color: #9ca3af;">VS</div>
            <div style="text-align: center;">
              <div style="font-weight: 600; color: #6b7280; margin-bottom: 4px;">${DOM.escape(this.partidaAtual.robo2)}</div>
              <div id="previewPtsR2" style="font-size: 36px; font-weight: 900; color: #10b981;">9</div>
              <small style="color: #6b7280;">pts de dano</small>
            </div>
          </div>
        </div>

        <button id="btnDefinirDano" class="btn-save" style="width: 100%;">
          ✅ Confirmar Dano Consensual e Finalizar Partida
        </button>

        <p style="margin: 16px 0 0 0; font-size: 13px; color: #92400e; text-align: center;">
          ⚠️ Atenção: Após confirmar, o dano será aplicado e a partida será finalizada!
        </p>
      </div>
    `;
  },

  renderAguardandoDano() {
    const juradoResponsavel = this.partidaAtual.juradoResponsavelDano;
    
    return `
      <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 20px;">
        <h4 style="margin: 0 0 12px 0; color: #92400e;">⏳ Aguardando Jurado ${juradoResponsavel}</h4>
        <p style="margin: 0; color: #78350f; line-height: 1.6;">
          Os 3 jurados devem conversar fisicamente e decidir o tipo de dano.<br>
          O <strong>Jurado ${juradoResponsavel}</strong> foi o último a completar a avaliação de agressividade,<br>
          portanto ele irá registrar a decisão consensual no sistema.<br><br>
          Aguarde o Jurado ${juradoResponsavel} definir o dano para finalizar a partida.
        </p>
        <button onclick="CombateJurado.carregarPartida()" class="btn-edit" style="margin-top: 16px;">
          🔄 Recarregar Partida
        </button>
      </div>

      <div style="background: #e0f2fe; border: 2px solid #3b82f6; border-radius: 10px; padding: 16px;">
        <h4 style="margin: 0 0 12px 0; color: #1e40af;">✅ Você já completou sua avaliação!</h4>
        <p style="margin: 0; color: #1e3a8a; font-size: 14px;">
          Todos os 3 jurados julgaram a agressividade do round.<br>
          Sua parte está concluída. Aguarde a definição do dano consensual. 
        </p>
      </div>
    `;
  },

  renderInfoAgressividade() {
    const juradoKey = `jurado${this.juradoId}`;
    const totalJulgado = this.partidaAtual. julgamentos[juradoKey].length;
    
    return `
      <div style="background: #e0f2fe; border: 2px solid #3b82f6; border-radius: 10px; padding: 16px; margin-bottom: 20px;">
        <h4 style="margin: 0 0 12px 0; color: #1e40af;">⚡ Julgue APENAS a Agressividade</h4>
        <p style="margin: 0; color: #1e3a8a; font-size: 14px; line-height: 1.6;">
          📊 Progresso: <strong>${totalJulgado > 0 ? '1/1 round julgado' : '0/1 rounds julgados'}</strong><br><br>
          
          <strong>Instruções:</strong><br>
          1. Avalie a agressividade do único round (5x0, 4x1, 3x2, etc.)<br>
          2. Após julgar, aguarde os outros jurados<br>
          3.  O último jurado a completar definirá o dano consensual<br>
          4. O dano será aplicado automaticamente
        </p>
      </div>
    `;
  },

  renderDanoFixo() {
    const juradoResponsavel = this.partidaAtual.juradoResponsavelDano;
    
    return `
      <div style="background: #dcfce7; border: 2px solid #10b981; border-radius: 10px; padding: 16px; margin-bottom: 20px;">
        <h4 style="margin: 0 0 12px 0; color: #065f46;">✅ Dano Consensual Definido (pelo Jurado ${juradoResponsavel})</h4>
        <p style="margin: 0 0 12px 0; font-size: 14px; color: #047857;">
          Este dano foi acordado entre os 3 jurados após todos completarem a avaliação de agressividade. <br>
          A partida foi finalizada.
        </p>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 12px;">
          <div style="background: white; padding: 12px; border-radius: 8px; border: 1px solid #86efac;">
            <div style="font-weight: 700; color: #1f2937; margin-bottom: 4px;">🤖 ${DOM.escape(this.partidaAtual.robo1)}</div>
            <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">
              Dano: <strong style="color: #047857;">${this.partidaAtual.danoConsensual.danoR1}</strong>
            </div>
            <div style="font-size: 28px; font-weight: 900; color: #10b981;">
              ${this.partidaAtual. danoConsensual.pontosDanoR1} pts
            </div>
            <small style="color: #6b7280;">dano total</small>
          </div>
          
          <div style="background: white; padding: 12px; border-radius: 8px; border: 1px solid #86efac;">
            <div style="font-weight: 700; color: #1f2937; margin-bottom: 4px;">🤖 ${DOM.escape(this.partidaAtual.robo2)}</div>
            <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">
              Dano: <strong style="color: #047857;">${this.partidaAtual.danoConsensual.danoR2}</strong>
            </div>
            <div style="font-size: 28px; font-weight: 900; color: #10b981;">
              ${this.partidaAtual.danoConsensual.pontosDanoR2} pts
            </div>
            <small style="color: #6b7280;">dano total</small>
          </div>
        </div>
      </div>
    `;
  },

  renderRound(julgamentosFeitos, isVisualizacao) {
    let html = "";
    const jaJulgado = julgamentosFeitos.length > 0;

    html += `
      <div class="round-card" id="round1">
        <h4>Rodada Única</h4>
    `;

    if (jaJulgado) {
      const julgamento = julgamentosFeitos[0];
      html += `
        <div style="background: #f0fdf4; padding: 12px; border-radius: 8px; border: 1px solid #86efac;">
          <p style="margin: 0; color: #166534; font-weight: 600;">
            ✔ Rodada já julgada
          </p>
          <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280;">
            ${DOM.escape(this.partidaAtual.robo1)}: <strong>${julgamento.pontosR1 !== null ? julgamento.pontosR1 : 'Aguardando dano'}</strong> pts 
            ${julgamento.pontosR1 !== null ? `(Dano: ${julgamento.pontosDanoR1} + Agr: ${julgamento.pontosAgrR1})` : `(Agr: ${julgamento.pontosAgrR1})`}<br>
            ${DOM.escape(this.partidaAtual.robo2)}: <strong>${julgamento.pontosR2 !== null ?  julgamento.pontosR2 : 'Aguardando dano'}</strong> pts 
            ${julgamento.pontosR2 !== null ? `(Dano: ${julgamento.pontosDanoR2} + Agr: ${julgamento.pontosAgrR2})` : `(Agr: ${julgamento.pontosAgrR2})`}
          </p>
        </div>
      `;
    } else if (!isVisualizacao) {
      html += `
        <div style="margin-top: 20px;">
          <label style="display: block; text-align: center; margin-bottom: 10px; font-weight: 700; font-size: 16px;">
            ⚡ Julgue APENAS a Agressividade
          </label>
          <p style="text-align: center; margin: 0 0 12px 0; font-size: 14px; color: #6b7280;">
            Selecione a distribuição de agressividade:
          </p>
          <div class="agressividade-selector" id="agressividadeSelector_1">
            <button type="button" class="btn-agressividade" data-agr="5,0">
              ${DOM.escape(this.partidaAtual.robo1)} 5x0
            </button>
            <button type="button" class="btn-agressividade" data-agr="4,1">
              ${DOM.escape(this.partidaAtual.robo1)} 4x1
            </button>
            <button type="button" class="btn-agressividade" data-agr="3,2">
              ${DOM.escape(this.partidaAtual.robo1)} 3x2
            </button>
            <button type="button" class="btn-agressividade" data-agr="2,3">
              ${DOM.escape(this.partidaAtual.robo2)} 3x2
            </button>
            <button type="button" class="btn-agressividade" data-agr="1,4">
              ${DOM.escape(this.partidaAtual.robo2)} 4x1
            </button>
            <button type="button" class="btn-agressividade" data-agr="0,5">
              ${DOM.escape(this.partidaAtual.robo2)} 5x0
            </button>
          </div>
          <input type="hidden" id="agressividadeR_1" value="">
        </div>

        <button id="btnRound_1" class="btn-save" style="width: 100%; margin-top: 12px;" disabled>
          ✔ Confirmar Julgamento
        </button>
      `;
    }

    html += `</div>`;

    if (!isVisualizacao) {
      html += `
        <div style="background: #eff6ff; border: 1px solid #93c5fd; border-radius: 10px; padding: 16px; margin-top: 20px;">
          <p style="margin: 0 0 8px 0; font-weight: 700; color: #1e40af;">ℹ️ Informações Importantes:</p>
          <ul style="margin: 0; padding-left: 20px; color: #1e3a8a; font-size: 14px;">
            <li>Existe apenas 1 rodada para julgar</li>
            <li>Você julga apenas a <strong>Agressividade</strong></li>
            <li>Após todos os jurados julgarem, o último definirá o dano</li>
            <li>O dano será aplicado automaticamente e a partida será finalizada</li>
          </ul>
        </div>
      `;
    }

    return html;
  },

  atualizarPreviewDano() {
    const danoR1 = document.getElementById("danoR1").value;
    const danoR2 = document.getElementById("danoR2").value;

    const [ptsR1, ptsR2] = dataManager.calcularPontosDano(danoR1, danoR2);
    
    document.getElementById("previewPtsR1").textContent = ptsR1;
    document.getElementById("previewPtsR2").textContent = ptsR2;
  },

  async definirDanoConsensual() {
    try {
      const danoR1 = document.getElementById("danoR1").value;
      const danoR2 = document.getElementById("danoR2").value;

      dataManager.definirDanoConsensual(
        this.partidaAtual.id,
        this.juradoId,
        danoR1,
        danoR2
      );

      const [pontosDanoR1, pontosDanoR2] = dataManager.calcularPontosDano(danoR1, danoR2);

      toast.success(
        `✅ Dano Consensual Definido e Partida Finalizada!\n\n` +
        `${this.partidaAtual.robo1}: ${danoR1} (${pontosDanoR1} pts)\n` +
        `${this.partidaAtual.robo2}: ${danoR2} (${pontosDanoR2} pts)\n\n` +
        `Todos os julgamentos foram atualizados! `,
        6000
      );

      // Recarrega a partida para mostrar resultado final
      this.partidaAtual = dataManager.getPartida(this.partidaAtual.id);
      this.renderFormularioJulgamento();
    } catch (error) {
      toast.error(error.message);
    }
  },

  selecionarAgressividade(button) {
    const selector = document.getElementById(`agressividadeSelector_1`);
    const input = document.getElementById(`agressividadeR_1`);
    const btnConfirmar = document.getElementById(`btnRound_1`);

    // Remove seleção visual
    selector.querySelectorAll(".btn-agressividade").forEach((btn) => {
      btn.classList.remove("selected");
    });

    // Marca o botão clicado e habilita confirmar
    button.classList.add("selected");
    input.value = button.dataset.agr;
    btnConfirmar.disabled = false;
  },

  async confirmarRound() {
    try {
      const agressividade = document.getElementById(`agressividadeR_1`).value;

      Validators.required(agressividade, "Pontuação de Agressividade");

      const [pontosAgrR1, pontosAgrR2] = agressividade
        .split(",")
        . map((p) => parseFloat(p));

      // Salva apenas agressividade
      dataManager. addJulgamentoAgressividade(
        this.partidaAtual.id,
        this.juradoId,
        pontosAgrR1,
        pontosAgrR2
      );

      toast.success(
        `Rodada julgada!\n\n` +
        `Agressividade registrada:\n` +
        `${this.partidaAtual.robo1}: ${pontosAgrR1} pts\n` +
        `${this.partidaAtual.robo2}: ${pontosAgrR2} pts`,
        4000
      );

      // Recarrega partida
      this.partidaAtual = dataManager.getPartida(this.partidaAtual.id);
      this. renderFormularioJulgamento();

      // Verifica se este jurado se tornou o responsável pelo dano
      if (dataManager.isJuradoResponsavelDano(this.partidaAtual.id, this.juradoId)) {
        toast.info(
          `🎯 Você foi o último a completar!\n\n` +
          `Agora você deve conversar com os outros jurados\n` +
          `e definir o dano consensual para finalizar a partida. `,
          7000
        );
      } else if (this.partidaAtual.status === "aguardando_dano") {
        toast.info(
          `✅ Sua avaliação está completa!\n\n` +
          `Aguarde o Jurado ${this.partidaAtual.juradoResponsavelDano} definir o dano consensual.`,
          5000
        );
      }
    } catch (error) {
      toast.error(error.message);
    }
  },
};

window.CombateJurado = CombateJurado;