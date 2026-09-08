const dados = JSON.parse(
  sessionStorage.getItem("orcamentoParaImpressao") || "null",
);

function moeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function adicionarCelula(linha, valor) {
  const celula = document.createElement("td");
  celula.textContent = valor;
  linha.appendChild(celula);
}

if (!dados) {
  document.querySelector(".documento-impressao").textContent =
    "Nenhum orçamento foi selecionado para impressão.";
} else {
  const lista = document.getElementById("itensImpressao");
  dados.itens.forEach((item) => {
    const linha = document.createElement("tr");
    adicionarCelula(linha, item.descricao);
    adicionarCelula(linha, item.quantidade);
    adicionarCelula(linha, moeda(item.valorUnitario));
    adicionarCelula(linha, moeda(item.subtotal));
    lista.appendChild(linha);
  });

  document.getElementById("totaisImpressao").innerHTML =
    `Desconto: -${moeda(dados.desconto)}<br>Valor total: ${moeda(dados.total)}`;
  const dadosImpressao = document.getElementById("dadosImpressao");
  [
    ["Cliente", dados.cliente],
    ["Responsável", dados.responsavel],
    ["Data de emissão", dados.dataEmissao],
    ["Válido até", dados.dataValidade],
  ].forEach(([rotulo, valor]) => {
    const paragrafo = document.createElement("p");
    const titulo = document.createElement("strong");
    titulo.textContent = `${rotulo}: `;
    paragrafo.append(titulo, String(valor));
    dadosImpressao.appendChild(paragrafo);
  });
}

const emCelular = window.matchMedia("(max-width: 768px)").matches;
const botaoImprimir = document.getElementById("botaoImprimir");

if (emCelular) {
  botaoImprimir.textContent = "Salvar como PDF";
  const orientacao = document.getElementById("orientacaoPdf");
  orientacao.hidden = false;
  orientacao.textContent = "No menu do aparelho, escolha Salvar como PDF.";
}

botaoImprimir?.addEventListener("click", () => window.print());

window.addEventListener("load", () => {
  if (!emCelular) window.setTimeout(() => window.print(), 250);
});
