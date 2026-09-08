window.configuracaoCadastro = {
  tabela: "usuarios",
  chave: "id",
  relacionamento: null,
  campos: ["usuario", "senha", "tipo"],
  iniciar() {
    document.getElementById("campoTipo").hidden = !ehAdministrador;
    document.getElementById("tipo").disabled = !ehAdministrador;
  },
  normalizarCampos(campos) {
    if (!ehAdministrador) delete campos.tipo;
  },
  validar() {
    if (!ehAdministrador || ["A", "U"].includes(document.getElementById("tipo").value)) return true;
    avisar("Selecione o tipo A (Admin) ou U (Usuário).", true);
    return false;
  },
  formatarLinha: (item) => `<td>${escaparHtml(item.usuario)}</td>`,
  permitirAcesso() {
    const editando = new URLSearchParams(window.location.search).get("editar");
    if (
      ehAdministrador ||
      (editando && editando === sessionStorage.getItem("usuarioId"))
    ) return true;

    window.location.href = "Consulta.html?tipo=usuarios";
    return false;
  },
  validarCriacao() {
    if (ehAdministrador) return true;
    if (registroId.value) return this.permitirEdicao(registroId.value);

    avisar("Apenas administradores podem criar usuários.", true);
    return false;
  },
  permitirEdicao(id) {
    if (ehAdministrador || String(id) === sessionStorage.getItem("usuarioId"))
      return true;

    window.location.href = "Consulta.html?tipo=usuarios";
    return false;
  },
  aposSalvar({ id, campos }) {
    if (String(id) === sessionStorage.getItem("usuarioId")) {
      sessionStorage.setItem("usuarioLogado", campos.usuario);
      if (campos.tipo) sessionStorage.setItem("tipoUsuario", campos.tipo);
    }
  },
};
