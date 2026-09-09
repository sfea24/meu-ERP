window.enviarOrcamentoParaImpressao = async function (id, janela) {
  
    const resposta = await supabaseClient.from("orcamento").select("*, cliente(nome_cliente, cpf_cnpj_cliente), orcamento_item(produtoid, qt_produto, vl_unitario, vl_total, produto(ds_produto))").eq("orcamentoid", id).single();
    if (resposta.error) throw new Error(resposta.error.message);
    const registro = resposta.data;
    const dadosImpressao = {
      numero: registro.orcamentoid,
      cliente: registro.cliente?.nome_cliente ?? "",
      responsavel: sessionStorage.getItem("usuarioLogado") || "",
      dataEmissao: registro.dt_orcamento ? new Date(registro.dt_orcamento).toLocaleDateString("pt-BR") : "",
      dataValidade: registro.dt_validade_orcamento ? new Date(registro.dt_validade_orcamento).toLocaleDateString("pt-BR") : "",
      desconto: registro.desconto,
      total: registro.vl_total_orcamento,
      itens: (registro.orcamento_item ?? []).map(item => ({
        descricao: item.produto?.ds_produto ?? "",
        quantidade: item.qt_produto,
        valorUnitario: item.vl_unitario,
        subtotal: item.vl_total ?? (Number(item.qt_produto) * Number(item.vl_unitario)).toFixed(2),
      })),
    };
    janela.sessionStorage.setItem("orcamentoParaImpressao", JSON.stringify(dadosImpressao));
    janela.location.href = "Impressao.html";
    return true;
};
