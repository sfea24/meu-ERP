function formatarCpf(valor) {
  const numeros = valor.replace(/\D/g, "").slice(0, 11);
  return numeros
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatarCnpj(valor) {
  const caracteres = valor
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 14);
  const primeiraParte = caracteres.slice(0, 2);
  const segundaParte = caracteres.slice(2, 5);
  const terceiraParte = caracteres.slice(5, 8);
  const quartaParte = caracteres.slice(8, 12);
  const quintaParte = caracteres.slice(12, 14);
  let cnpj = primeiraParte;

  if (segundaParte) cnpj += "." + segundaParte;
  if (terceiraParte) cnpj += "." + terceiraParte;
  if (quartaParte) cnpj += "/" + quartaParte;
  if (quintaParte) cnpj += "-" + quintaParte;
  return cnpj;
}

function configurarCpfCnpj() {
  const tipoCliente = document.getElementById("tipo_cliente");
  const documento = document.getElementById("cpf_cnpj_cliente");

  function atualizarDocumento() {
    const pessoaFisica = tipoCliente.value === "F";
    documento.value = pessoaFisica
      ? formatarCpf(documento.value)
      : formatarCnpj(documento.value);
    documento.inputMode = pessoaFisica ? "numeric" : "text";
    documento.placeholder = pessoaFisica
      ? "000.000.000-00"
      : "00.000.000/0000-00";
  }

  tipoCliente.addEventListener("change", () => {
    documento.value = "";
    atualizarDocumento();
  });
  documento.addEventListener("input", atualizarDocumento);
  atualizarDocumento();
}

function documentoClienteValido() {
  const tipoCliente = document.getElementById("tipo_cliente").value;
  const documento = document.getElementById("cpf_cnpj_cliente");
  const semMascara = documento.value.replace(/[^A-Z0-9]/gi, "");
  const valido =
    tipoCliente === "F"
      ? /^\d{11}$/.test(semMascara)
      : /^[A-Z0-9]{14}$/i.test(semMascara);

  if (!valido) {
    const texto =
      tipoCliente === "F"
        ? "O CPF deve conter 11 números."
        : "O CNPJ deve conter 14 letras ou números.";
    avisar(texto, true);
    documento.focus();
  }
  return valido;
}

function formatarTelefone(valor) {
  const numeros = valor.replace(/\D/g, "").slice(0, 11);
  return numeros
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function iniciarCliente() {
  configurarCpfCnpj();
  const telefone = document.getElementById("telefone");
  telefone.addEventListener("input", () => {
    telefone.value = formatarTelefone(telefone.value);
  });
  telefone.value = formatarTelefone(telefone.value);
}

window.configuracaoCadastro = {
  tabela: "cliente",
  chave: "clienteid",
  relacionamento: null,
  campos: [
    "tipo_cliente",
    "cpf_cnpj_cliente",
    "nome_cliente",
    "telefone",
    "endereco",
  ],
  dependencia: [
    "orcamento",
    "clienteid",
    "Este cliente possui orçamentos cadastrados.",
  ],
  formatarLinha: (item) =>
    `<td>${escaparHtml(item.tipo_cliente)}</td><td>${escaparHtml(item.cpf_cnpj_cliente)}</td><td>${escaparHtml(item.nome_cliente)}</td><td>${escaparHtml(item.telefone)}</td><td>${escaparHtml(item.endereco)}</td>`,
  iniciar: iniciarCliente,
  validar: documentoClienteValido,
};
