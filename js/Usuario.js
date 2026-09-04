window.configuracaoCadastro = {
  tabela: "usuarios",
  chave: "usuario",
  relacionamento: null,
  campos: ["usuario", "senha"],
  formatarLinha: (item) => `<td>${escaparHtml(item.usuario)}</td>`,
  manterChaveNaEdicao: true,
  permitirAcesso() {
    const editando = new URLSearchParams(window.location.search).get("editar");
    if (ehAdministrador || editando) return true;

    window.location.href = "Consulta.html?tipo=usuarios";
    return false;
  },
  validarCriacao() {
    if (ehAdministrador || registroId.value) return true;

    avisar("Apenas administradores podem criar usuários.", true);
    return false;
  },
  permitirEdicao(id) {
    if (ehAdministrador || id === sessionStorage.getItem("usuarioLogado"))
      return true;

    window.location.href = "Consulta.html?tipo=usuarios";
    return false;
  },
  aposSalvar({ id, campos }) {
    if (id === sessionStorage.getItem("usuarioLogado"))
      sessionStorage.setItem("usuarioLogado", campos.usuario);
  },
};
