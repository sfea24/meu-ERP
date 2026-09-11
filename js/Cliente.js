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

function formatarTelefone(valor) {
  const numeros = String(valor ?? "").replace(/\D/g, "").slice(0, 11);
  if (!numeros) return "";
  if (numeros.length <= 2) return "(" + numeros;
  const numero = numeros.slice(2);
  const tamanhoPrefixo = 5;
  const parteFinal = numero.length > tamanhoPrefixo ? "-" + numero.slice(tamanhoPrefixo) : "";
  return "(" + numeros.slice(0, 2) + ") " + numero.slice(0, tamanhoPrefixo) + parteFinal;
}

function atualizarTelefone() {
  const campo = document.getElementById("telefone");
  campo.value = formatarTelefone(campo.value);
}

function configurarTelefone() {
  const campo = document.getElementById("telefone");
  function aplicarMascara() {
    const quantidadeAntes = campo.value.slice(0, campo.selectionStart ?? campo.value.length)
      .replace(/\D/g, "").length;
    campo.value = formatarTelefone(campo.value);
    let posicao = 0, encontrados = 0;
    while (posicao < campo.value.length && encontrados < quantidadeAntes) {
      if (/\d/.test(campo.value[posicao])) encontrados++;
      posicao++;
    }
    campo.setSelectionRange(posicao, posicao);
  }
  campo.addEventListener("input", aplicarMascara);
  campo.addEventListener("beforeinput", evento => {
    if (!["deleteContentBackward", "deleteContentForward"].includes(evento.inputType)
        || campo.selectionStart !== campo.selectionEnd) return;
    const numeros = campo.value.replace(/\D/g, "");
    const antes = campo.value.slice(0, campo.selectionStart).replace(/\D/g, "").length;
    const indice = evento.inputType === "deleteContentBackward" ? antes - 1 : antes;
    evento.preventDefault();
    if (indice < 0 || indice >= numeros.length) return;
    campo.value = numeros.slice(0, indice) + numeros.slice(indice + 1);
    campo.setSelectionRange(indice, indice);
    campo.dispatchEvent(new Event("input", { bubbles: true }));
  });
  atualizarTelefone();
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
  iniciar() {
    configurarCpfCnpj();
    configurarTelefone();
  },
  atualizarBusca: atualizarTelefone,
  normalizarCampos(campos) {
    campos.telefone = formatarTelefone(campos.telefone);
  },
  validar: documentoClienteValido,
};
