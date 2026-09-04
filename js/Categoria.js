window.configuracaoCadastro = {
  tabela: "categoria_produto",
  chave: "categoriaprodutoid",
  relacionamento: null,
  campos: ["ds_categoria_produto"],
  dependencia: [
    "produto",
    "categoriaprodutoid",
    "Esta categoria possui produtos cadastrados.",
  ],
  formatarLinha: (item) => `<td>${escaparHtml(item.ds_categoria_produto)}</td>`,
};
