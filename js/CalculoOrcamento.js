// Valores e desconto em centavos.
const CalculoOrcamento = {
  centavos(valor) {
    const texto = String(valor);
    if (!/^\d+(\.\d{1,2})?$/.test(texto)) throw new Error("Informe valores não negativos com até duas casas decimais.");
    const [inteiro, decimal = ""] = texto.split(".");
    const resultado = Number(inteiro) * 100 + Number(decimal.padEnd(2, "0"));
    if (!Number.isSafeInteger(resultado) || resultado > 99999999999) throw new Error("Valor acima do limite permitido.");
    return resultado;
  },
  calcular(itens, informado) {
    const subtotais = itens.map(item => {
      if (!Number.isSafeInteger(item.quantidade) || item.quantidade < 1 || item.quantidade > 1000000) throw new Error("Informe uma quantidade inteira entre 1 e 1.000.000.");
      const valor = this.centavos(item.valor) * item.quantidade;
      if (!Number.isSafeInteger(valor) || valor > 99999999999) throw new Error("Subtotal acima do limite permitido.");
      return valor;
    });
    const subtotal = subtotais.reduce((a, b) => a + b, 0);
    if (!Number.isSafeInteger(subtotal) || subtotal > 99999999999) throw new Error("Total acima do limite permitido.");
    const desconto = this.centavos(informado);
    if (desconto > subtotal) throw new Error("O desconto não pode superar o subtotal.");
    return { subtotais, subtotal, desconto, total: subtotal - desconto };
  },
};
if (typeof module !== "undefined") module.exports = CalculoOrcamento;
