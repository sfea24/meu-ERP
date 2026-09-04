window.configuracaoCadastro = {
  tabela: "produto",
  chave: "produtoid",
  relacionamento: {
    tabela: "categoria_produto",
    select: "categoriaprodutoid",
    texto: "ds_categoria_produto",
  },
  campos: [
    "categoriaprodutoid",
    "ds_produto",
    "obs_produto",
    "vl_venda_produto",
    "dt_cadastro_produto",
    "status_produto",
  ],
  consulta: "*, categoria_produto(ds_categoria_produto)",
  camposNumericos: ["categoriaprodutoid", "vl_venda_produto"],
  dependencia: [
    "orcamento_item",
    "produtoid",
    "Este produto está vinculado a itens de orçamento.",
  ],
  formatarLinha: (item) => {
    const status = statusProduto(item.status_produto);
    return `<td>${escaparHtml(item.ds_produto)}</td><td>${formatarMoeda(item.vl_venda_produto)}</td><td>${escaparHtml(item.categoria_produto?.ds_categoria_produto)}</td><td><span class="status-produto status-${status === "INATIVO" ? "inativo" : "ativo"}">${status || "ATIVO"}</span></td>`;
  },
  normalizarCampos(campos) {
    campos.status_produto = statusProduto(campos.status_produto);
  },
  iniciar() {
    const busca = document.getElementById("buscaCategoria");
    const select = document.getElementById("categoriaprodutoid");
    const sugestoes = document.getElementById("sugestoesCategoria");

    if (!busca || !select || !sugestoes || busca.dataset.configurada) return;

    busca.dataset.configurada = "true";
    buscaCategoria = configurarBuscaSelect(busca, select, sugestoes);
  },
  atualizarBusca() {
    buscaCategoria?.atualizar();
  },
  preencherCamposPadrao() {
    if (registroId.value) return;
    document.getElementById("dt_cadastro_produto").value = dataParaCampo(
      new Date(),
    );
  },
};
