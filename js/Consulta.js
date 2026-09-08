const tipo =
  new URLSearchParams(window.location.search).get("tipo") || "cliente";
const porPagina = 5;
let ehAdministrador = false;
let paginaAtual = 1;
let registros = [];

const titulo = document.getElementById("tituloConsulta");
const cabecalho = document.getElementById("cabecalhoConsulta");
const corpoTabela = document.getElementById("listaConsulta");
const busca = document.getElementById("busca");
const mensagem = document.getElementById("mensagem");
const botaoAnterior = document.getElementById("paginaAnterior");
const botaoProxima = document.getElementById("proximaPagina");
const numeroPagina = document.getElementById("numeroPagina");

const tipos = {
  cliente: {
    titulo: "Consulta de Clientes",
    chave: "clienteid",
    pagina: "Cliente.html",
    colunas: ["Tipo", "CPF/CNPJ", "Nome"],
    select: "*",
    valores: (item) => [
      item.tipo_cliente,
      item.cpf_cnpj_cliente,
      item.nome_cliente,
    ],
  },

  categoria_produto: {
    titulo: "Consulta de Categorias",
    chave: "categoriaprodutoid",
    pagina: "Categoria.html",
    colunas: ["Descrição"],
    select: "*",
    valores: (item) => [item.ds_categoria_produto],
  },

  produto: {
    titulo: "Consulta de Produtos",
    chave: "produtoid",
    pagina: "Produto.html",
    colunas: ["Descrição", "Valor", "Categoria", "Status"],
    select: "*, categoria_produto(ds_categoria_produto)",
    valores: (item) => [
      item.ds_produto,
      moeda(item.vl_venda_produto),
      item.categoria_produto?.ds_categoria_produto,
      item.status_produto,
    ],
  },

  orcamento: {
    titulo: "Consulta de Orçamentos",
    chave: "orcamentoid",
    pagina: "Orcamento.html",
    colunas: ["Cliente", "Data", "Validade", "Valor total"],
    select: "*, cliente(nome_cliente)",
    valores: (item) => [
      item.cliente?.nome_cliente,
      data(item.dt_orcamento),
      data(item.dt_validade_orcamento),
      moeda(item.vl_total_orcamento),
    ],
  },

  usuarios: {
    titulo: "Consulta de Usuários",
    chave: "id",
    pagina: "Usuario.html",
    get colunas() {
      return ehAdministrador ? ["Usuário", "Tipo"] : ["Usuário"];
    },
    get select() {
      return ehAdministrador ? "id, usuario, tipo" : "id, usuario";
    },
    valores: (item) => ehAdministrador
      ? [item.usuario, item.tipo === "A" ? "A (Admin)" : "U (Usuário)"]
      : [item.usuario],
  },
};

const configuracao = tipos[tipo] || tipos.cliente;
const tabela = tipos[tipo] ? tipo : "cliente";
document.body.classList.toggle("tela-consulta", tabela !== "usuarios");

function moeda(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function data(valor) {
  return valor ? String(valor).slice(0, 10).split("-").reverse().join("/") : "";
}

function mostrarMensagem(texto, erro = false) {
  mensagem.textContent = texto;

  mensagem.className = erro ? "erro" : "sucesso";
}

function criarCabecalho() {
  const linha = document.createElement("tr");
  ["Código", ...configuracao.colunas, "Ações"].forEach((nome) => {
    const coluna = document.createElement("th");

    coluna.textContent = nome;
    coluna.scope = "col";

    if (nome === "Ações") {
      coluna.className = "cabecalho-acoes";
    }

    linha.appendChild(coluna);
  });

  cabecalho.appendChild(linha);
}

function registrosBuscados() {
  const texto = busca.value.toLowerCase().trim();

  if (!texto) return registros;

  return registros.filter((item) =>
    configuracao.valores(item).join(" ").toLowerCase().includes(texto),
  );
}

function mostrarTabela() {
  const encontrados = registrosBuscados();
  const totalPaginas = Math.max(1, Math.ceil(encontrados.length / porPagina));

  if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;
  corpoTabela.innerHTML = "";

  const inicio = (paginaAtual - 1) * porPagina;
  const pagina = encontrados.slice(inicio, inicio + porPagina);

  if (!pagina.length) {
    const linha = document.createElement("tr");
    const coluna = document.createElement("td");

    coluna.colSpan = configuracao.colunas.length + 2;
    coluna.className = "sem-resultados";
    coluna.textContent = "Nenhum registro encontrado.";
    linha.appendChild(coluna);
    corpoTabela.appendChild(linha);
  }

  pagina.forEach((item) => {
    const linha = document.createElement("tr");
    const codigo = document.createElement("td");

    codigo.textContent = item[configuracao.chave] ?? "";
    codigo.dataset.label = "Código";
    linha.appendChild(codigo);

    configuracao.valores(item).forEach((valor, indice) => {
      const coluna = document.createElement("td");

      coluna.textContent = valor ?? "";
      coluna.dataset.label = configuracao.colunas[indice];
      if (tabela === "produto" && configuracao.colunas[indice] === "Status") {
        const status = String(valor ?? "").trim().toUpperCase();
        if (["ATIVO", "INATIVO"].includes(status)) {
          const etiqueta = document.createElement("span");
          etiqueta.className = `status-produto status-${status.toLowerCase()}`;
          etiqueta.textContent = status;
          coluna.replaceChildren(etiqueta);
        }
      }

      linha.appendChild(coluna);
    });

    const acoes = document.createElement("td");
    acoes.dataset.label = "Ações";
    const editar = document.createElement("button");

    editar.textContent = "Editar";
    editar.className = "botao-tabela";
    editar.addEventListener(
      "click",
      () =>
        (window.location.href = `${configuracao.pagina}?editar=${encodeURIComponent(item[configuracao.chave])}`),
    );

    acoes.appendChild(editar);
    if (tabela !== "usuarios" || ehAdministrador) {
      const excluir = document.createElement("button");

      excluir.textContent = "Excluir";
      excluir.className = "botao-tabela botao-excluir";
      excluir.addEventListener("click", () =>
        excluirRegistro(item[configuracao.chave]),
      );

      acoes.appendChild(excluir);
    }

    linha.appendChild(acoes);
    corpoTabela.appendChild(linha);
  });

  numeroPagina.textContent = `Página ${paginaAtual} de ${totalPaginas}`;
  botaoAnterior.disabled = paginaAtual === 1;
  botaoProxima.disabled = paginaAtual === totalPaginas;
}

async function possuiDependencias(id) {
  const dependencias = {
    cliente: [
      "orcamento",
      "clienteid",
      "Este cliente possui orçamentos cadastrados.",
    ],
    categoria_produto: [
      "produto",
      "categoriaprodutoid",
      "Esta categoria possui produtos cadastrados.",
    ],
    produto: [
      "orcamento_item",
      "produtoid",
      "Este produto está vinculado a itens de orçamento.",
    ],
    orcamento: [
      "orcamento_item",
      "orcamentoid",
      "Este orçamento possui itens cadastrados.",
    ],
  };
  const dependencia = dependencias[tabela];
  if (!dependencia) return false;

  const resposta = await supabaseClient
    .from(dependencia[0])
    .select(dependencia[1])
    .eq(dependencia[1], id)
    .limit(1);
  if (resposta.error) {
    mostrarMensagem(
      "Erro ao verificar dados vinculados: " + resposta.error.message,
      true,
    );
    return true;
  }
  if (resposta.data.length) {
    mostrarMensagem(
      `${dependencia[2]} Exclua ou altere os registros vinculados primeiro.`,
      true,
    );
    return true;
  }
  return false;
}

async function excluirRegistro(id) {
  if (
    !confirm(
      tabela === "orcamento"
        ? "Deseja excluir este orçamento e todos os itens vinculados a ele?"
        : "Deseja excluir este registro?",
    )
  )
    return;
  if (tabela === "orcamento") {
    const itens = await supabaseClient
      .from("orcamento_item")
      .delete()
      .eq("orcamentoid", id);
    if (itens.error)
      return mostrarMensagem(
        "Erro ao excluir os itens do orçamento: " + itens.error.message,
        true,
      );
  }
  if (await possuiDependencias(id)) return;

  const resposta = await supabaseClient
    .from(tabela)
    .delete()
    .eq(configuracao.chave, id);

  if (resposta.error)
    return mostrarMensagem("Erro ao excluir: " + resposta.error.message, true);

  registros = registros.filter((item) => item[configuracao.chave] !== id);
  mostrarTabela();
}

async function carregarRegistros() {
  let consulta = supabaseClient
    .from(tabela)
    .select(configuracao.select)
    .order(configuracao.chave, { ascending: false });

  if (tabela === "usuarios" && !ehAdministrador)
    consulta = consulta.eq("id", sessionStorage.getItem("usuarioId"));

  const resposta = await consulta;

  if (resposta.error)
    return mostrarMensagem(
      "Erro ao consultar: " + resposta.error.message,
      true,
    );
  registros = resposta.data;
  mostrarTabela();
}

function sair() {
  sessionStorage.removeItem("usuarioLogado");
  sessionStorage.removeItem("usuarioId");
  sessionStorage.removeItem("tipoUsuario");
  window.location.href = "index.html";
}

function configurarBarraMobile() {
  const barra = document.querySelector(".barra-navegacao");
  if (!barra || document.querySelector(".menu-mobile-toggle")) return;
  const alca = document.createElement("button");
  alca.type = "button";
  alca.className = "menu-mobile-toggle";
  alca.setAttribute("aria-label", "Abrir menu de navegação");
  alca.setAttribute("aria-expanded", "false");
  alca.textContent = "☰";
  barra.appendChild(alca);

  function definirAberta(aberta) {
    document.body.classList.toggle("barra-mobile-aberta", aberta);
    alca.setAttribute("aria-expanded", String(aberta));
    alca.setAttribute(
      "aria-label",
      aberta ? "Fechar menu de navegação" : "Abrir menu de navegação",
    );
    alca.textContent = aberta ? "×" : "☰";
  }

  alca.addEventListener("click", () =>
    definirAberta(!document.body.classList.contains("barra-mobile-aberta")),
  );
  let inicioToque = 0;
  alca.addEventListener(
    "touchstart",
    (evento) => {
      inicioToque = evento.touches[0].clientY;
    },
    { passive: true },
  );
  alca.addEventListener(
    "touchend",
    (evento) => {
      const movimento = evento.changedTouches[0].clientY - inicioToque;
      if (movimento > 25) definirAberta(true);
      if (movimento < -25) definirAberta(false);
    },
    { passive: true },
  );
}

async function iniciar() {
  if (!sessionStorage.getItem("usuarioLogado"))
    return (window.location.href = "index.html");
  try {
    ehAdministrador = await atualizarTipoUsuario();
  } catch (erro) {
    mostrarMensagem("Erro ao verificar permissões: " + erro.message, true);
    return;
  }
  if (!ehAdministrador) document.querySelector(".criar-usuarios")?.remove();

  titulo.textContent = configuracao.titulo;

  criarCabecalho();

  document.querySelector(`[data-tipo="${tabela}"]`)?.classList.add("ativo");

  document.getElementById("botaoSair").addEventListener("click", sair);
  configurarBarraMobile();

  busca.addEventListener("input", () => {
    paginaAtual = 1;
    mostrarTabela();
  });

  botaoAnterior.addEventListener("click", () => {
    paginaAtual--;
    mostrarTabela();
  });

  botaoProxima.addEventListener("click", () => {
    paginaAtual++;
    mostrarTabela();
  });

  await carregarRegistros();
}

iniciar();
