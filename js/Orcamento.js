const campoOrcamento = id => document.getElementById(id);
window.configuracaoCadastro = {
  tabela: "orcamento", chave: "orcamentoid",
  consultaEdicao: "*",
  normalizarRegistro(registro) {
    registro.desconto_informado = registro.desconto ?? 0;
    return registro;
  },
  relacionamento: { tabela: "cliente", select: "clienteid", texto: "nome_cliente" },
  campos: ["clienteid", "dt_orcamento", "dt_validade_orcamento", "desconto", "vl_total_orcamento", "desconto_informado"],
  camposNumericos: ["clienteid", "desconto", "vl_total_orcamento", "desconto_informado"],
  iniciar() {
    campoOrcamento("desconto_informado").addEventListener("input", () => this.recalcularTotal());
  },
  preencherCamposPadrao() {
    if (registroId.value) return;
    const hoje = new Date(), validade = new Date();
    validade.setDate(validade.getDate() + 7);
    campoOrcamento("dt_orcamento").value = dataParaCampo(hoje);
    campoOrcamento("dt_validade_orcamento").value = dataParaCampo(validade);
    this.recalcularTotal();
  },
  obterItens() {
    return [...document.querySelectorAll(".item-orcamento")].map(item => ({
      produtoid: Number(item.querySelector(".produto-orcamento").value),
      quantidade: Number(item.querySelector(".quantidade-orcamento").value),
      valor: item.querySelector(".valor-orcamento").value,
    }));
  },
  calcular() { return CalculoOrcamento.calcular(this.obterItens(), campoOrcamento("desconto_informado").value); },
  recalcularTotal() {
    const desconto = campoOrcamento("desconto_informado");
    desconto.setCustomValidity("");
    try {
      const valores = this.calcular();
      campoOrcamento("desconto").value = (valores.desconto / 100).toFixed(2);
      campoOrcamento("vl_total_orcamento").value = (valores.total / 100).toFixed(2);
    } catch (erro) {
      campoOrcamento("vl_total_orcamento").value = "";
      desconto.setCustomValidity(erro.message);
    }
  },
  validar() {
    try {
      if (!campoOrcamento("clienteid").value) throw new Error("Selecione um cliente na lista de sugestões.");
      const itens = this.obterItens();
      if (!itens.length || itens.some(item => !item.produtoid)) throw new Error("Adicione pelo menos um item e selecione seu produto.");
      if (campoOrcamento("dt_validade_orcamento").value < campoOrcamento("dt_orcamento").value) throw new Error("A validade não pode ser anterior à emissão.");
      this.calcular(); this.recalcularTotal();
      return true;
    } catch (erro) { avisar(erro.message, true); return false; }
  },
  async salvar(id, campos, itens) {
    // Persiste somente os campos do cadastro original, sem depender de migrações.
    const dados = Object.fromEntries(
      ["clienteid", "dt_orcamento", "dt_validade_orcamento", "desconto", "vl_total_orcamento"]
        .map(campo => [campo, campos[campo]]),
    );
    const valores = this.calcular();
    let orcamentoId = id ? Number(id) : null;
    let itensAnteriores = [];
    let itensRemovidos = false;
    let itensGravados = false;
    const novo = !orcamentoId;
    const conferir = resposta => {
      if (resposta.error) throw new Error(resposta.error.message);
      return resposta.data;
    };

    try {
      if (novo) {
        const registro = conferir(await supabaseClient.from("orcamento")
          .insert(dados).select("orcamentoid").single());
        orcamentoId = registro.orcamentoid;
      } else {
        itensAnteriores = conferir(await supabaseClient.from("orcamento_item")
          .select("*").eq("orcamentoid", orcamentoId));
        conferir(await supabaseClient.from("orcamento_item")
          .delete().eq("orcamentoid", orcamentoId));
        itensRemovidos = true;
      }

      conferir(await supabaseClient.from("orcamento_item").insert(itens.map((item, indice) => ({
        orcamentoid: orcamentoId,
        produtoid: item.produtoid,
        qt_produto: item.quantidade,
        vl_unitario: Number(item.valor),
        vl_total: valores.subtotais[indice] / 100,
      }))));
      itensGravados = true;

      if (!novo) {
        conferir(await supabaseClient.from("orcamento").update(dados)
          .eq("orcamentoid", orcamentoId).select("orcamentoid").single());
      }
      return { data: orcamentoId, error: null };
    } catch (erro) {
      // As requisições são separadas; tenta restaurar os itens em caso de falha.
      try {
        if (itensGravados) {
          conferir(await supabaseClient.from("orcamento_item")
            .delete().eq("orcamentoid", orcamentoId));
        }
        if (novo && orcamentoId) {
          conferir(await supabaseClient.from("orcamento")
            .delete().eq("orcamentoid", orcamentoId).select("orcamentoid").single());
        } else if (itensRemovidos && itensAnteriores.length) {
          conferir(await supabaseClient.from("orcamento_item").insert(itensAnteriores));
        }
      } catch (erroRestauracao) {
        if (novo && orcamentoId) registroId.value = orcamentoId;
        return { error: { message: `${erro.message} Não foi possível restaurar o orçamento ${orcamentoId}: ${erroRestauracao.message}. Confira o registro antes de tentar novamente.` } };
      }
      return { error: { message: erro.message } };
    }
  },
  async imprimir(janela) {
    return enviarOrcamentoParaImpressao(registroId.value, janela);
  },
};
