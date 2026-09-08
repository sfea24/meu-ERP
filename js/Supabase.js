const SUPABASE_URL = "https://qykkmyafqeylxlmxnoaf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_irL3TYn5iWDtZm6proZRiw_tLLmeu7r";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function atualizarTipoUsuario() {
  const usuario = sessionStorage.getItem("usuarioLogado");
  sessionStorage.removeItem("tipoUsuario");
  sessionStorage.removeItem("usuarioId");
  if (!usuario) return false;

  const resposta = await supabaseClient
    .from("usuarios")
    .select("id, tipo")
    .eq("usuario", usuario)
    .maybeSingle();

  if (resposta.error) throw new Error(resposta.error.message);
  if (!resposta.data) throw new Error("Usuário da sessão não encontrado.");

  const tipo = String(resposta.data.tipo ?? "").trim().toUpperCase();
  sessionStorage.setItem("usuarioId", String(resposta.data.id));
  sessionStorage.setItem("tipoUsuario", tipo === "A" ? "A" : "U");
  return tipo === "A";
}
