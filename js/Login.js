const formLogin = document.getElementById("formLogin");
const mensagem = document.getElementById("mensagem");

function avisar(texto, erro = false) {
  mensagem.textContent = texto;
  mensagem.className = erro ? "erro" : "sucesso";
  if (erro) alert(texto);
}

formLogin.addEventListener("submit", async function (evento) {
  evento.preventDefault();
  const usuario = document.getElementById("usuario").value;
  const password = document.getElementById("senha").value;
  try {
    const buscaUsuario = await supabaseClient
      .from("usuarios")
      .select("id, usuario, senha, tipo")
      .eq("usuario", usuario)
      .maybeSingle();

    if (buscaUsuario.error) {
      avisar("Erro ao buscar usuário: " + buscaUsuario.error.message, true);
      return;
    }

    if (!buscaUsuario.data) {
      avisar("Usuário ou senha inválidos.", true);
      return;
    }

    if (buscaUsuario.data.senha !== password) {
      avisar("Usuário ou senha inválidos.", true);
      return;
    }

    sessionStorage.setItem("usuarioLogado", buscaUsuario.data.usuario);
    sessionStorage.setItem("usuarioId", String(buscaUsuario.data.id));
    sessionStorage.setItem("tipoUsuario", buscaUsuario.data.tipo === "A" ? "A" : "U");
    window.location.href = "Menu.html";
  } catch (erro) {
    avisar("Não foi possível conectar ao Supabase: " + erro.message, true);
  }
});

async function verificarSessao() {
  if (sessionStorage.getItem("usuarioLogado"))
    window.location.href = "Menu.html";
}

verificarSessao();
