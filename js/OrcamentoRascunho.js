// Rascunhos locais: não alteram o orçamento salvo no banco.
window.OrcamentoRascunho = {
  ativo: false,
  base: "",
  chave: "",
  ignorarSaida: false,
  aviso(texto) { document.getElementById("avisoRascunho").textContent = texto; },
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
  remover() {
    try { localStorage.removeItem(this.chave); return true; }
    catch { this.aviso("Não foi possível apagar o rascunho deste navegador."); return false; }
  },
  registrar() {
    if (!this.ativo) return;
    if (!this.alterado()) {
      if (this.remover()) this.aviso("");
      return;
    }
    try {
      localStorage.setItem(this.chave, JSON.stringify({ versao: 1, dados: this.capturar() }));
    } catch {
      this.aviso("Não foi possível guardar o rascunho neste navegador. Salve o orçamento para não perder as alterações.");
    }
  },
  confirmarSaida() {
    if (salvandoRegistro) return false;
    if (this.alterado() && !confirm("Há alterações não salvas no orçamento. Deseja sair mesmo assim?")) return false;
    this.ignorarSaida = true;
    return true;
  },
  confirmarLimpeza() {
    if (this.alterado() && !confirm("Deseja limpar o formulário e descartar o rascunho?")) return false;
    this.ativo = false;
    this.remover();
    return true;
  },
  limpo() {
    const mudouContexto = this.chave !== this.prefixo + "novo";
    history.replaceState(null, "", "Orcamento.html");
    document.querySelector("h1").textContent = "Cadastro de Orçamentos";
    this.chave = this.prefixo + "novo";
    this.base = JSON.stringify(this.capturar());
    this.ativo = true;
    this.aviso("");
    avisar("");
    // Reabre o cadastro para oferecer um eventual rascunho de novo orçamento.
    if (mudouContexto) window.location.href = "Orcamento.html";
  },
  salvo({ redirecionar = false } = {}) {
    const removido = this.remover();
    history.replaceState(null, "", `Orcamento.html?editar=${encodeURIComponent(registroId.value)}`);
    this.chave = this.prefixo + "editar:" + registroId.value;
    this.base = JSON.stringify(this.capturar());
    // A navegação após salvar pode ocorrer antes do finally liberar salvandoRegistro.
    this.ignorarSaida = redirecionar;
    if (removido) this.aviso("Orçamento salvo.");
  },
  async restaurar(dados) {
    if (!dados || !dados.campos || !Array.isArray(dados.itens)) throw new Error("Rascunho inválido");
    const ids = [...new Set(dados.itens.map(item => Number(item.produtoid)).filter(id => id > 0))]
      .filter(id => !produtosOrcamento.some(produto => produto.produtoid === id));
    if (ids.length) {
      const resposta = await supabaseClient.from("produto")
        .select("produtoid, ds_produto, vl_venda_produto, status_produto").in("produtoid", ids);
      if (resposta.error) throw new Error(resposta.error.message);
      produtosOrcamento.push(...resposta.data);
    }
    config.campos.forEach(id => { document.getElementById(id).value = dados.campos[id] ?? ""; });
    buscaCliente.atualizar();
    document.getElementById("buscaCliente").value = dados.buscaCliente || "";
    document.getElementById("itensOrcamento").replaceChildren();
    dados.itens.forEach(item => {
      adicionarItemOrcamento(item.produtoid, item.quantidade, item.valor);
      document.querySelector(".item-orcamento:last-child input[type=search]").value = item.busca || "";
    });
    config.recalcularTotal();
  },
  async iniciar() {
    const parametros = new URLSearchParams(location.search);
    this.prefixo = "scp:orcamento:rascunho:v1:" + encodeURIComponent(sessionStorage.getItem("usuarioId") || sessionStorage.getItem("usuarioLogado")) + ":";
    this.chave = this.prefixo + (parametros.get("editar") ? "editar:" + parametros.get("editar")
      : parametros.get("duplicar") ? "duplicar:" + parametros.get("duplicar") : "novo");
    this.base = JSON.stringify(this.capturar());
    try {
      const texto = localStorage.getItem(this.chave);
      if (texto) {
        const rascunho = JSON.parse(texto);
        if (rascunho.versao !== 1) throw new Error("Versão inválida");
        if (confirm("Existe um rascunho não salvo para este orçamento neste navegador. Deseja recuperá-lo? Cancelar descarta o rascunho.")) {
          await this.restaurar(rascunho.dados);
        } else this.remover();
      }
    } catch {
      this.aviso("Não foi possível recuperar o rascunho neste navegador.");
    }
    this.ativo = true;
    // Uma cópia ainda não salva também deve ser recuperável.
    if (parametros.has("duplicar") && !parametros.has("editar")) {
      this.base = "";
      this.registrar();
    }
    formCadastro.addEventListener("input", () => this.registrar());
    formCadastro.addEventListener("change", () => this.registrar());
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
