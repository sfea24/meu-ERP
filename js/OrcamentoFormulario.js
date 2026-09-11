// Acompanha alterações somente enquanto a página está aberta, sem salvar rascunhos.
window.OrcamentoFormulario = {
  ativo: false,
  base: "",
  ignorarSaida: false,
  capturar() {
    return {
      campos: Object.fromEntries(config.campos.map(id => [id, document.getElementById(id).value])),
      buscaCliente: document.getElementById("buscaCliente").value,
      itens: [...document.querySelectorAll(".item-orcamento")].map(item => ({
        produtoid: item.querySelector(".produto-orcamento").value,
        quantidade: item.querySelector(".quantidade-orcamento").value,
        valor: item.querySelector(".valor-orcamento").value,
        busca: item.querySelector('input[type="search"]').value,
      })),
    };
  },
  alterado() { return this.ativo && JSON.stringify(this.capturar()) !== this.base; },
  confirmarSaida() {
    if (salvandoRegistro) return false;
    if (this.alterado() && !confirm("Há alterações não salvas no orçamento. Deseja sair mesmo assim?")) return false;
    this.ignorarSaida = true;
    return true;
  },
  confirmarLimpeza() {
    return !this.alterado() || confirm("Deseja limpar o formulário e descartar as alterações?");
  },
  limpo() {
    history.replaceState(null, "", "Orcamento.html");
    document.querySelector("h1").textContent = "Cadastro de Orçamentos";
    this.base = JSON.stringify(this.capturar());
    this.ignorarSaida = false;
    avisar("");
  },
  salvo({ redirecionar = false } = {}) {
    history.replaceState(null, "", `Orcamento.html?editar=${encodeURIComponent(registroId.value)}`);
    document.querySelector("h1").textContent = "Cadastro de Orçamentos";
    this.base = JSON.stringify(this.capturar());
    // O redirecionamento pode começar antes de o salvamento liberar os controles.
    this.ignorarSaida = redirecionar;
    avisar("Orçamento salvo.");
  },
  iniciar() {
    const parametros = new URLSearchParams(location.search);
    const duplicando = parametros.has("duplicar") && !parametros.get("editar");
    this.base = duplicando ? "" : JSON.stringify(this.capturar());
    this.ativo = true;
    window.addEventListener("beforeunload", evento => {
      if (this.ignorarSaida || (!this.alterado() && !salvandoRegistro)) return;
      evento.preventDefault();
      evento.returnValue = "";
    });
    document.addEventListener("click", evento => {
      const link = evento.target.closest("a[href]");
      if (!link || link.target === "_blank" || evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey) return;
      if (!this.confirmarSaida()) evento.preventDefault();
    });
    window.addEventListener("pageshow", () => { this.ignorarSaida = false; });
  },
};
