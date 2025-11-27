// ============================================
// ARQUIVO: data.js - CORRIGIDO PARA 1 ROUND
// Última versão: 1 round apenas
// CORREÇÃO: Dano não é mais triplicado
// CORREÇÃO: Pontos totais calculados corretamente no placar
// ============================================

// Tabela de Dano Oficial TRIF 2025 (conforme PDF)
const MATRIZ_DANO_OFICIAL = {
  Trivial: {
    Trivial: [9, 9],
    Cosmético: [10, 8],
    Menor: [12, 6],
    Significativo: [14, 4],
    Maior: [16, 2],
    Massivo: [18, 0],
  },
  Cosmético: {
    Trivial: [8, 10],
    Cosmético: [9, 9],
    Menor: [10, 8],
    Significativo: [12, 6],
    Maior: [14, 4],
    Massivo: [17, 1],
  },
  Menor: {
    Trivial: [6, 12],
    Cosmético: [8, 10],
    Menor: [9, 9],
    Significativo: [11, 7],
    Maior: [13, 5],
    Massivo: [15, 3],
  },
  Significativo: {
    Trivial: [4, 14],
    Cosmético: [6, 12],
    Menor: [7, 11],
    Significativo: [9, 9],
    Maior: [11, 7],
    Massivo: [13, 5],
  },
  Maior: {
    Trivial: [2, 16],
    Cosmético: [4, 14],
    Menor: [5, 13],
    Significativo: [7, 11],
    Maior: [9, 9],
    Massivo: [11, 7],
  },
  Massivo: {
    Trivial: [0, 18],
    Cosmético: [1, 17],
    Menor: [3, 15],
    Significativo: [5, 13],
    Maior: [7, 11],
    Massivo: [9, 9],
  },
};

// Níveis de dano disponíveis
const NIVEIS_DANO = [
  "Trivial",
  "Cosmético",
  "Menor",
  "Significativo",
  "Maior",
  "Massivo",
];

// Classe de gerenciamento de dados
class DataManager {
  constructor() {
    this.storageKeys = {
      competicao: "trif_competicao",
      robos: "trif_robos",
      partidas: "trif_partidas",
      relatorios: "trif_relatorios",
    };
    this.init();
  }

  init() {
    if (!this.getCompeticao()) {
      this.saveCompeticao({
        nome: "",
        local: "",
        data: "",
        descricao: "",
      });
    }

    if (!this.getRobos()) {
      this.saveRobos({});
    }

    if (!this.getPartidas()) {
      this.savePartidas([]);
    }

    if (!this.getRelatorios()) {
      this.saveRelatorios([]);
    }
  }

  // Métodos de Competição
  getCompeticao() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKeys.competicao));
    } catch {
      return null;
    }
  }

  saveCompeticao(data) {
    localStorage.setItem(this.storageKeys.competicao, JSON.stringify(data));
  }

  // Métodos de Robôs
  getRobos() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKeys.robos)) || {};
    } catch {
      return {};
    }
  }

  saveRobos(robos) {
    localStorage.setItem(this.storageKeys.robos, JSON.stringify(robos));
  }

  addRobo(nome, dados) {
    const robos = this.getRobos();
    robos[nome] = {
      ...dados,
      pontos: robos[nome]?.pontos || 0,
      criadoEm: robos[nome]?.criadoEm || Date.now(),
      atualizadoEm: Date.now(),
    };
    this.saveRobos(robos);
    return robos[nome];
  }

  deleteRobo(nome) {
    const robos = this.getRobos();
    delete robos[nome];
    this.saveRobos(robos);
  }

  getRobo(nome) {
    return this.getRobos()[nome] || null;
  }

  // Métodos de Partidas
  getPartidas() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKeys.partidas)) || [];
    } catch {
      return [];
    }
  }

  savePartidas(partidas) {
    localStorage.setItem(this.storageKeys.partidas, JSON.stringify(partidas));
  }

  createPartida(robo1, robo2) {
    const partidas = this.getPartidas();

    const proximoNumero = partidas.length + 1;
    const id = proximoNumero.toString().padStart(3, "0");

    const partida = {
      id: id,
      robo1,
      robo2,
      status: "aguardando_agressividade",
      danoConsensual: null,
      juradoResponsavelDano: null, // Armazena qual jurado deve definir o dano
      julgamentos: {
        jurado1: [],
        jurado2: [],
        jurado3: [],
      },
      resultado: null,
      criadaEm: Date.now(),
    };
    partidas.push(partida);
    this.savePartidas(partidas);
    return partida;
  }

  getPartidaAtual() {
    const partidas = this.getPartidas();
    return (
      partidas.find((p) => p.status !== "finalizada") ||
      partidas[partidas.length - 1] ||
      null
    );
  }

  getPartida(id) {
    return this.getPartidas().find((p) => p.id === id) || null;
  }

  updatePartida(id, updates) {
    const partidas = this.getPartidas();
    const index = partidas.findIndex((p) => p.id === id);
    if (index !== -1) {
      partidas[index] = { ...partidas[index], ...updates };
      this.savePartidas(partidas);
      return partidas[index];
    }
    return null;
  }

  deletePartida(id) {
    const partidas = this.getPartidas();
    const index = partidas.findIndex((p) => p.id === id);

    if (index === -1) {
      throw new Error("Partida não encontrada");
    }

    const partida = partidas[index];

    if (partida.status === "finalizada" && partida.resultado) {
      this.removerPontosDoRanking(partida.resultado);
    }

    partidas.splice(index, 1);
    this.savePartidas(partidas);

    return true;
  }

  removerPontosDoRanking(resultado) {
    const robos = this.getRobos();

    if (robos[resultado.robo1]) {
      robos[resultado.robo1].pontos = Math.max(
        0,
        (robos[resultado.robo1].pontos || 0) - resultado.pontosR1
      );
    }

    if (robos[resultado.robo2]) {
      robos[resultado.robo2].pontos = Math.max(
        0,
        (robos[resultado.robo2].pontos || 0) - resultado.pontosR2
      );
    }

    this.saveRobos(robos);
  }

  // MODIFICADO: Adicionar julgamento de agressividade para 1 ROUND
  addJulgamentoAgressividade(partidaId, juradoId, pontosAgrR1, pontosAgrR2) {
    const partida = this.getPartida(partidaId);
    if (!partida) return null;

    const juradoKey = `jurado${juradoId}`;

    // Verifica se jurado já julgou (1 julgamento = 1 round)
    if (partida.julgamentos[juradoKey].length > 0) {
      throw new Error(`Você já julgou esta partida`);
    }

    // Salva apenas agressividade por enquanto
    partida.julgamentos[juradoKey].push({
      round: 1, // FIXO: apenas 1 round
      pontosAgrR1,
      pontosAgrR2,
      danoR1: null,
      danoR2: null,
      pontosDanoR1: null,
      pontosDanoR2: null,
      pontosR1: null,
      pontosR2: null,
      timestamp: Date.now(),
    });

    // NOVO: Verifica se TODOS os 3 jurados completaram seus julgamentos
    const todosJulgaramAgressividade =
      partida.julgamentos.jurado1.length === 1 &&
      partida.julgamentos.jurado2.length === 1 &&
      partida.julgamentos.jurado3.length === 1;

    if (
      todosJulgaramAgressividade &&
      partida.status === "aguardando_agressividade"
    ) {
      // Este é o último jurado a completar!
      partida.status = "aguardando_dano";
      partida.juradoResponsavelDano = juradoId; // Define quem deve julgar o dano
    }

    return this.updatePartida(partidaId, partida);
  }

  // NOVO: Verificar se jurado é responsável por definir o dano
  isJuradoResponsavelDano(partidaId, juradoId) {
    const partida = this.getPartida(partidaId);
    if (!partida) return false;
    return partida.juradoResponsavelDano === juradoId;
  }

  // MODIFICADO: Definir dano consensual (só o jurado responsável pode)
  definirDanoConsensual(partidaId, juradoId, danoR1, danoR2) {
    const partida = this.getPartida(partidaId);
    if (!partida) {
      throw new Error("Partida não encontrada");
    }

    if (partida.status !== "aguardando_dano") {
      throw new Error("Todos os jurados devem julgar a agressividade primeiro");
    }

    // Verifica se este jurado é o responsável
    if (partida.juradoResponsavelDano !== juradoId) {
      throw new Error(
        `Apenas o Jurado ${partida.juradoResponsavelDano} pode definir o dano (último a completar a agressividade)`
      );
    }

    // Calcula pontos de dano
    const [pontosDanoR1, pontosDanoR2] = this.calcularPontosDano(
      danoR1,
      danoR2
    );

    // Define dano consensual
    partida.danoConsensual = {
      danoR1,
      danoR2,
      pontosDanoR1,
      pontosDanoR2,
      definidoPor: `Jurado ${juradoId}`,
      definidoEm: Date.now(),
    };

    // Atualiza APENAS o julgamento do jurado responsável com o dano
    const juradoKey = `jurado${juradoId}`;
    partida.julgamentos[juradoKey].forEach((julgamento) => {
      julgamento.danoR1 = danoR1;
      julgamento.danoR2 = danoR2;
      julgamento.pontosDanoR1 = pontosDanoR1;
      julgamento.pontosDanoR2 = pontosDanoR2;
      // Calcula pontos totais APENAS para este jurado
      julgamento.pontosR1 = julgamento.pontosAgrR1 + pontosDanoR1;
      julgamento.pontosR2 = julgamento.pontosAgrR2 + pontosDanoR2;
    });

    // Os outros jurados mantêm apenas agressividade
    ["jurado1", "jurado2", "jurado3"].forEach((jurado) => {
      if (jurado !== juradoKey) {
        partida.julgamentos[jurado].forEach((julgamento) => {
          // Apenas agressividade (sem dano)
          julgamento.pontosR1 = julgamento.pontosAgrR1;
          julgamento.pontosR2 = julgamento.pontosAgrR2;
        });
      }
    });

    // Finaliza partida
    partida.status = "finalizada";
    partida.resultado = this.calcularResultadoFinal(partida);
    this.atualizarRanking(partida.resultado);

    return this.updatePartida(partidaId, partida);
  }

  calcularResultadoFinal(partida) {
    let totalAgrR1 = 0;
    let totalAgrR2 = 0;

    // Soma apenas a agressividade de cada jurado
    ["jurado1", "jurado2", "jurado3"].forEach((jurado) => {
      partida.julgamentos[jurado].forEach((j) => {
        totalAgrR1 += j.pontosAgrR1;
        totalAgrR2 += j.pontosAgrR2;
      });
    });

    // Adiciona o dano UMA ÚNICA VEZ (não triplicado)
    const totalR1 = totalAgrR1 + partida.danoConsensual.pontosDanoR1;
    const totalR2 = totalAgrR2 + partida.danoConsensual.pontosDanoR2;

    return {
      robo1: partida.robo1,
      robo2: partida.robo2,
      pontosR1: totalR1,
      pontosR2: totalR2,
      vencedor: totalR1 > totalR2 ? partida.robo1 : partida.robo2,
      finalizadaEm: Date.now(),
    };
  }

  atualizarRanking(resultado) {
    const robos = this.getRobos();

    if (robos[resultado.robo1]) {
      robos[resultado.robo1].pontos =
        (robos[resultado.robo1].pontos || 0) + resultado.pontosR1;
    }

    if (robos[resultado.robo2]) {
      robos[resultado.robo2].pontos =
        (robos[resultado.robo2].pontos || 0) + resultado.pontosR2;
    }

    this.saveRobos(robos);
  }

  // Métodos de Relatórios de Inspeção
  getRelatorios() {
    try {
      return (
        JSON.parse(localStorage.getItem(this.storageKeys.relatorios)) || []
      );
    } catch {
      return [];
    }
  }

  saveRelatorios(relatorios) {
    localStorage.setItem(
      this.storageKeys.relatorios,
      JSON.stringify(relatorios)
    );
  }

  addRelatorio(relatorio) {
    const relatorios = this.getRelatorios();
    relatorios.push({
      id: Date.now(),
      ...relatorio,
      criadoEm: Date.now(),
    });
    this.saveRelatorios(relatorios);
  }

  // Métodos de Cálculo
  calcularPontosDano(danoR1, danoR2) {
    if (!MATRIZ_DANO_OFICIAL[danoR1] || !MATRIZ_DANO_OFICIAL[danoR1][danoR2]) {
      throw new Error(`Combinação de dano inválida: ${danoR1} vs ${danoR2}`);
    }
    return MATRIZ_DANO_OFICIAL[danoR1][danoR2];
  }

  // Limpar todos os dados
  clearAllData() {
    if (
      confirm(
        "ATENÇÃO: Isso irá apagar TODOS os dados do sistema. Deseja continuar?"
      )
    ) {
      Object.values(this.storageKeys).forEach((key) => {
        localStorage.removeItem(key);
      });
      this.init();
      return true;
    }
    return false;
  }
}

// Exporta instância global
window.dataManager = new DataManager();
window.MATRIZ_DANO_OFICIAL = MATRIZ_DANO_OFICIAL;
window.NIVEIS_DANO = NIVEIS_DANO;
