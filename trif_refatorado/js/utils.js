// utils.js - Utilitários e Componentes de UI

// Sistema de Notificações Toast
class ToastManager {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.className = "toast-container";
      document.body.appendChild(this.container);
    }
  }

  show(message, type = "info", duration = 3000) {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    const icon = this.getIcon(type);
    toast.innerHTML = `
      <span style="font-size: 20px;">${icon}</span>
      <span style="flex: 1;">${this.escapeHtml(message)}</span>
    `;

    this.container.appendChild(toast);

    // Remove após duração
    setTimeout(() => {
      toast.style.animation = "slideIn 0.3s ease reverse";
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  getIcon(type) {
    const icons = {
      success: "✓",
      error: "✕",
      warning: "⚠",
      info: "ℹ",
    };
    return icons[type] || icons.info;
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  success(message, duration) {
    this.show(message, "success", duration);
  }

  error(message, duration) {
    this.show(message, "error", duration);
  }

  warning(message, duration) {
    this.show(message, "warning", duration);
  }

  info(message, duration) {
    this.show(message, "info", duration);
  }
}

// Utilitários de DOM
const DOM = {
  // Limpa conteúdo de um elemento
  clear(selector) {
    const el =
      typeof selector === "string"
        ? document.querySelector(selector)
        : selector;
    if (el) el.innerHTML = "";
  },

  // Cria elemento com atributos
  create(tag, attributes = {}, children = []) {
    const el = document.createElement(tag);

    Object.entries(attributes).forEach(([key, value]) => {
      if (key === "className") {
        el.className = value;
      } else if (key === "style" && typeof value === "object") {
        Object.assign(el.style, value);
      } else if (key.startsWith("on") && typeof value === "function") {
        el.addEventListener(key.substring(2).toLowerCase(), value);
      } else {
        el.setAttribute(key, value);
      }
    });

    children.forEach((child) => {
      if (typeof child === "string") {
        el.appendChild(document.createTextNode(child));
      } else if (child instanceof Node) {
        el.appendChild(child);
      }
    });

    return el;
  },

  // Escapa HTML para prevenir XSS
  escape(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  },

  // Cria título de seção
  createTitle(text) {
    return this.create("h3", {}, [text]);
  },
};

// Gerenciador de Menu
class MenuManager {
  constructor() {
    this.hamburger = null;
    this.menu = null;
    this.backdrop = null;
    this.currentPage = null;
  }

  init() {
    this.hamburger = document.getElementById("hamburger");
    this.menu = document.getElementById("menu");
    this.backdrop = document.getElementById("menu-backdrop");

    if (this.hamburger) {
      this.hamburger.onclick = () => this.toggle();
    }

    if (this.backdrop) {
      this.backdrop.onclick = () => this.close();
    }
  }

  toggle() {
    const isOpen = this.menu.classList.contains("open");
    if (isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.menu.classList.add("open");
    this.backdrop.classList.add("open");
    this.hamburger.setAttribute("aria-expanded", "true");
  }

  close() {
    this.menu.classList.remove("open");
    this.backdrop.classList.remove("open");
    this.hamburger.setAttribute("aria-expanded", "false");
  }

  setActive(buttonId) {
    // Remove ativo de todos
    const buttons = this.menu.querySelectorAll("button");
    buttons.forEach((btn) => btn.classList.remove("is-active"));

    // Adiciona ao clicado
    const button = document.getElementById(buttonId);
    if (button) {
      button.classList.add("is-active");
    }

    // Fecha menu no mobile
    if (window.innerWidth <= 880) {
      this.close();
    }
  }

  setupNavigation(routes) {
    Object.entries(routes).forEach(([buttonId, handler]) => {
      const button = document.getElementById(buttonId);
      if (button) {
        button.addEventListener("click", () => {
          this.setActive(buttonId);
          if (handler) handler();
        });
      }
    });
  }
}

// Validadores
const Validators = {
  required(value, fieldName = "Campo") {
    if (!value || value.toString().trim() === "") {
      throw new Error(`${fieldName} é obrigatório`);
    }
    return true;
  },

  number(value, fieldName = "Campo") {
    if (isNaN(value)) {
      throw new Error(`${fieldName} deve ser um número`);
    }
    return true;
  },

  range(value, min, max, fieldName = "Campo") {
    this.number(value, fieldName);
    const num = Number(value);
    if (num < min || num > max) {
      throw new Error(`${fieldName} deve estar entre ${min} e ${max}`);
    }
    return true;
  },

  email(value, fieldName = "Email") {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(value)) {
      throw new Error(`${fieldName} inválido`);
    }
    return true;
  },
};

// Formatadores
const Formatters = {
  date(timestamp) {
    return new Date(timestamp).toLocaleString("pt-BR");
  },

  dateShort(timestamp) {
    return new Date(timestamp).toLocaleDateString("pt-BR");
  },

  number(num, decimals = 0) {
    return Number(num).toFixed(decimals);
  },

  truncate(text, maxLength = 50) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  },
};

// Helpers de Loading
const Loading = {
  show(button) {
    if (button) {
      button.disabled = true;
      button.dataset.originalText = button.textContent;
      button.textContent = "Carregando...";
    }
  },

  hide(button) {
    if (button && button.dataset.originalText) {
      button.disabled = false;
      button.textContent = button.dataset.originalText;
      delete button.dataset.originalText;
    }
  },
};

// Confirmação de ações
const Confirm = {
  async ask(message, title = "Confirmação") {
    return new Promise((resolve) => {
      const result = confirm(`${title}\n\n${message}`);
      resolve(result);
    });
  },

  async delete(itemName) {
    return this.ask(
      `Tem certeza que deseja excluir "${itemName}"?\n\nEsta ação não pode ser desfeita.`,
      "Confirmar Exclusão"
    );
  },
};

// Exporta instâncias globais
window.toast = new ToastManager();
window.menuManager = new MenuManager();
window.DOM = DOM;
window.Validators = Validators;
window.Formatters = Formatters;
window.Loading = Loading;
window.Confirm = Confirm;