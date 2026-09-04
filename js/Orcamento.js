window.configuracaoCadastro = {
  tabela: "orcamento",
  chave: "orcamentoid",
  relacionamento: {
    tabela: "cliente",
    select: "clienteid",
    texto: "nome_cliente",
  },
  campos: [
    "clienteid",
    "dt_orcamento",
    "dt_validade_orcamento",
    "desconto",
    "vl_total_orcamento",
  ],
  consulta: "*, cliente(nome_cliente)",
  camposNumericos: ["clienteid", "desconto", "vl_total_orcamento"],
  dependencia: [
    "orcamento_item",
    "orcamentoid",
    "Este orçamento possui itens cadastrados.",
  ],
  formatarLinha: (item) =>
    `<td>${escaparHtml(item.cliente?.nome_cliente)}</td>
  <td>${formatarData(item.dt_orcamento)}</td>
  <td>${formatarData(item.dt_validade_orcamento)}</td>
  <td>${formatarMoeda(item.vl_total_orcamento)}</td>`,

  preencherCamposPadrao() {
    if (registroId.value) return;

    const hoje = new Date();
    const validade = new Date();
    validade.setDate(validade.getDate() + 7);

    document.getElementById("dt_orcamento").value = dataParaCampo(hoje);
    const campoValidade = document.getElementById("dt_validade_orcamento");
    campoValidade.min = dataParaCampo(hoje);
    campoValidade.value = dataParaCampo(validade);
  },

  obterItens() {
    return [...document.querySelectorAll(".item-orcamento")].map((item) => {
      const produtoid = Number(item.querySelector(".produto-orcamento").value);
      const quantidade = Number(
        item.querySelector(".quantidade-orcamento").value,
      );
      const produto = produtosOrcamento.find(
        (produtoBanco) => produtoBanco.produtoid === produtoid,
      );

      return {
        produtoid,
        quantidade,
        valor: Number(produto?.vl_venda_produto),
      };
    });
  },

  recalcularTotal() {
    const subtotal = this.obterItens().reduce(
      (soma, item) => soma + (item.valor || 0) * (item.quantidade || 0),
      0,
    );
    const desconto = Math.max(
      0,
      Number(document.getElementById("desconto")?.value) || 0,
    );
    document.getElementById("vl_total_orcamento").value = Math.max(
      0,
      subtotal - desconto,
    ).toFixed(2);
  },
  async imprimir() {
    const itens = this.obterItens();
    const clienteId = document.getElementById("clienteid").value;
    const respostaCliente = await supabaseClient
      .from("cliente")
      .select("nome_cliente, telefone, endereco")
      .eq("clienteid", clienteId)
      .maybeSingle();

    if (respostaCliente.error)
      return avisar(
        "Erro ao carregar os dados do cliente: " +
          respostaCliente.error.message,
        true,
      );

    const cliente =
      respostaCliente.data?.nome_cliente ||
      document.getElementById("buscaCliente")?.value ||
      "Não informado";
    const responsavel =
      sessionStorage.getItem("usuarioLogado") || "Não informado";
    const dataEmissao =
      formatarData(document.getElementById("dt_orcamento").value) ||
      formatarData(dataParaCampo(new Date()));
    const dataValidade =
      formatarData(document.getElementById("dt_validade_orcamento").value) ||
      "Não informada";
    const desconto = Math.max(
      0,
      Number(document.getElementById("desconto")?.value) || 0,
    );
    const total = Number(
      document.getElementById("vl_total_orcamento").value || 0,
    );
    const dadosImpressao = {
      cliente,
      telefone: respostaCliente.data?.telefone || "Não informado",
      endereco: respostaCliente.data?.endereco || "Não informado",
      responsavel,
      dataEmissao,
      dataValidade,
      desconto,
      total,
      itens: itens.map((item) => {
        const produto = produtosOrcamento.find(
          (produtoBanco) => produtoBanco.produtoid === item.produtoid,
        );
        return {
          descricao: produto?.ds_produto || "Produto não informado",
          quantidade: item.quantidade,
          valorUnitario: item.valor,
          subtotal: item.valor * item.quantidade,
        };
      }),
    };

    sessionStorage.setItem(
      "orcamentoParaImpressao",
      JSON.stringify(dadosImpressao),
    );
    const janela = window.open("Impressao.html", "_blank");
    if (!janela)
      avisar(
        "Não foi possível abrir a impressão. Verifique se o navegador bloqueou pop-ups.",
        true,
      );
  },
};
