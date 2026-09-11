const elementoImpressao = id => document.getElementById(id);
const botaoImprimir = elementoImpressao("botaoImprimir");
let documentoPronto = false;

function moeda(centavos) {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function validarDadosImpressao(dados) {
  if (!dados || !dados.numero || !dados.cliente?.trim()
      || !dados.dataEmissao || !dados.dataValidade
      || !Array.isArray(dados.itens) || !dados.itens.length) {
    throw new Error("O orçamento está incompleto. Abra o cadastro e gere o PDF novamente.");
  }
  const itens = dados.itens.map(item => {
    if (!item.descricao?.trim()) throw new Error("Há um produto sem descrição no orçamento.");
    return { quantidade: Number(item.quantidade), valor: item.valorUnitario };
  });
  const valores = CalculoOrcamento.calcular(itens, dados.desconto);
  const totalSalvo = CalculoOrcamento.centavos(dados.total);
  if (valores.total !== totalSalvo || dados.itens.some((item, indice) =>
    CalculoOrcamento.centavos(item.subtotal) !== valores.subtotais[indice])) {
    throw new Error("Os valores dos itens não correspondem ao total salvo. Confira o orçamento antes de imprimir.");
  }
  return valores;
}

function preencherDocumento(dados, valores) {
  const empresa = window.empresaImpressao;
  const numero = String(dados.numero).padStart(5, "0");
  elementoImpressao("nomeEmpresa").textContent = empresa.nome;
  elementoImpressao("logoEmpresa").src = empresa.logo;
  elementoImpressao("logoEmpresa").alt = empresa.nome;
  for (const campo of ["documento", "contato", "endereco"]) {
    const elemento = elementoImpressao(campo + "Empresa");
    elemento.textContent = empresa[campo] || "";
    elemento.hidden = !empresa[campo]?.trim();
  }
  const textos = {
    numeroOrcamento: numero,
    nomeCliente: dados.cliente,
    dataEmissao: dados.dataEmissao,
    dataValidade: dados.dataValidade,
    referenciaTabela: "Orçamento nº " + numero,
    referenciaRodape: empresa.nome + " · Orçamento nº " + numero,
    responsavelImpressao: dados.responsavel || "—",
    subtotalImpressao: moeda(valores.subtotal),
    descontoImpressao: (valores.desconto > 0 ? "− " : "") + moeda(valores.desconto),
    totalImpressao: moeda(valores.total),
  };
  for (const [id, texto] of Object.entries(textos)) elementoImpressao(id).textContent = texto;
  elementoImpressao("linhaDesconto").hidden = false;
  const lista = elementoImpressao("itensImpressao");
  dados.itens.forEach((item, indice) => {
    const linha = document.createElement("tr");
    for (const valor of [item.descricao, item.quantidade,
      moeda(CalculoOrcamento.centavos(item.valorUnitario)), moeda(valores.subtotais[indice])]) {
      const celula = document.createElement("td");
      celula.textContent = valor;
      linha.appendChild(celula);
    }
    lista.appendChild(linha);
  });
  const nomeArquivo = dados.cliente.trim().replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
    .replace(/\s+/g, "_").slice(0, 60);
  document.title = "Orcamento_" + numero + "_" + nomeArquivo;
  document.querySelector(".documento-impressao").hidden = false;
}

botaoImprimir.addEventListener("click", () => {
  if (documentoPronto) window.print();
});

async function prepararImpressao() {
  try {
    const dados = JSON.parse(sessionStorage.getItem("orcamentoParaImpressao") || "null");
    const valores = validarDadosImpressao(dados);
    preencherDocumento(dados, valores);
    await document.fonts.ready;
    await elementoImpressao("logoEmpresa").decode().catch(() => {});
    await new Promise(resolve => requestAnimationFrame(resolve));
    documentoPronto = true;
    botaoImprimir.disabled = false;
    // Mantém a abertura automática no computador e a ação manual no celular.
    if (window.matchMedia("(max-width: 768px)").matches) {
      botaoImprimir.textContent = "Salvar como PDF";
      elementoImpressao("orientacaoPdf").hidden = false;
      elementoImpressao("orientacaoPdf").textContent = "No menu do aparelho, escolha Salvar como PDF.";
    } else {
      window.print();
    }
  } catch (erro) {
    document.querySelector(".documento-impressao").hidden = true;
    elementoImpressao("erroImpressao").textContent = erro.message;
    elementoImpressao("erroImpressao").hidden = false;
  }
}

prepararImpressao();
