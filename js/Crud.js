const config = window.configuracaoCadastro;
const tabela = config?.tabela;
const formCadastro = document.getElementById("formCadastro");
const mensagem = document.getElementById("mensagem");
const registroId = document.getElementById("registroId");
let ehAdministrador = false;

let produtosOrcamento = [];
let buscaCliente;
let buscaCategoria;
let salvandoRegistro = false;
let imprimindoOrcamento = false;

const avisoAlteracoes = {
  ativo: false,
  base: "",
  ignorarSaida: false,
  capturar() {
    return JSON.stringify([...formCadastro.elements]
      .filter(elemento => elemento.matches("input, select, textarea"))
      .map(elemento => [elemento.id, elemento.value,
        ["checkbox", "radio"].includes(elemento.type) ? elemento.checked : null]));
  },
  alterado() { return this.ativo && this.capturar() !== this.base; },
  confirmarSaida() {
    if (salvandoRegistro) return false;
    if (this.alterado() && !confirm("Há alterações não salvas. Deseja sair mesmo assim?")) return false;
    this.ignorarSaida = true;
    return true;
  },
  confirmarLimpeza() {
    return !this.alterado() || confirm("Deseja limpar o formulário e descartar as alterações não salvas?");
  },
  salvo({ redirecionar = false } = {}) {
    this.base = this.capturar();
    this.ignorarSaida = redirecionar;
  },
  limpo() { this.salvo(); },
  iniciar() {
    this.base = this.capturar();
    this.ativo = true;
    window.addEventListener("beforeunload", evento => {
      if (this.ignorarSaida || (!this.alterado() && !salvandoRegistro)) return;
      evento.preventDefault();
      evento.returnValue = "";
    });
    document.addEventListener("click", evento => {
      const link = evento.target.closest("a[href]");
      if (evento.defaultPrevented || !link || link.target === "_blank" || link.hasAttribute("download") || evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey) return;
      if (!this.confirmarSaida()) evento.preventDefault();
    });
    window.addEventListener("pageshow", () => { this.ignorarSaida = false; });
  },
};

function protecaoFormulario() {
  return tabela === "orcamento" ? window.OrcamentoRascunho : avisoAlteracoes;
}

function avisar(texto, erro = false) {
  mensagem.textContent = texto;
  mensagem.className = erro ? "erro" : "sucesso";

  if (erro) alert(texto);
}

function escaparHtml(texto) {
  const elemento = document.createElement("div");

  elemento.textContent = texto ?? "";

  return elemento.innerHTML;
}

function formatarDataHoraParaCampo(data) {
  return data ? String(data).slice(0, 16) : "";
}

function statusProduto(status) {
  const valor = String(status ?? "")
    .trim()
    .toUpperCase();

  return ["ATIVO", "INATIVO"].includes(valor) ? valor : "";
}

function dataParaCampo(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  const hora = String(data.getHours()).padStart(2, "0");
  const minuto = String(data.getMinutes()).padStart(2, "0");

  return `${ano}-${mes}-${dia}T${hora}:${minuto}`;
}

async function protegerPagina() {
  if (!sessionStorage.getItem("usuarioLogado")) {
    window.location.href = "index.html";
    return false;
  }

  try {
    ehAdministrador = await atualizarTipoUsuario();
  } catch (erro) {
    avisar("Erro ao verificar permissões: " + erro.message, true);
    return false;
  }

  return config.permitirAcesso?.() ?? true;
}

function adicionarBarraNavegacao() {
  const paginas = {
    cliente: ["Clientes", "Cliente.html"],

    categoria_produto: ["Categorias", "Categoria.html"],

    produto: ["Produtos", "Produto.html"],

    orcamento: ["Orçamentos", "Orcamento.html"],
  };

  const links = Object.entries(paginas)
    .map(
      ([chave, [nome, pagina]]) =>
        `<a class="${chave === tabela ? "ativo" : ""}" href="${pagina}">${nome}</a>`,
    )
    .join("");

  const consultas = Object.entries(paginas)
    .map(
      ([chave, [nome]]) => `<a href="Consulta.html?tipo=${chave}">${nome}</a>`,
    )
    .join("");

  document.body.insertAdjacentHTML(
    "afterbegin",
    `
    <header class="barra-navegacao">
      <a class="marca" href="Menu.html" aria-label="Página inicial"><img src="Imagens/logo.png" alt="SaberTI" /></a>
      <div class="navegacoes">
        <nav class="menu-dropdown" aria-label="Cadastros"><details><summary>Cadastros <b aria-hidden="true">⌄</b></summary><div class="opcoes-menu">${links}</div></details></nav>
        <nav class="menu-dropdown" aria-label="Consultas"><details><summary>Consultas <b aria-hidden="true">⌄</b></summary><div class="opcoes-menu">${consultas}</div></details></nav>
        <nav class="menu-dropdown" aria-label="Manutenção"><details><summary>Manutenção <b aria-hidden="true">⌄</b></summary><div class="opcoes-menu">${ehAdministrador ? '<a href="Usuario.html">Criar usuários</a>' : ""}<a href="Consulta.html?tipo=usuarios">Editar usuário</a></div></details></nav>
      </div>
      <button id="botaoSair" type="button">Sair</button>
    </header>
  `,
  );

  document.body.classList.add("com-barra-navegacao");
  document.getElementById("botaoSair").addEventListener("click", () => {
    if (!protecaoFormulario()?.confirmarSaida()) return;
    sessionStorage.removeItem("usuarioLogado");
    sessionStorage.removeItem("usuarioId");
  sessionStorage.removeItem("tipoUsuario");
    window.location.href = "index.html";
  });

  configurarBarraMobile();
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

async function carregarRelacionamentos() {
  if (!config.relacionamento) return;

  const relacao = config.relacionamento;
  const select = document.getElementById(relacao.select);
  const resposta = await supabaseClient
    .from(relacao.tabela)
    .select(`${relacao.select}, ${relacao.texto}`)
    .order(relacao.texto);

  if (resposta.error)
    return avisar("Erro ao carregar opções: " + resposta.error.message, true);

  select.innerHTML = '<option value="" disabled selected></option>';
  resposta.data.forEach((item) => {
    select.innerHTML += `<option value="${item[relacao.select]}">${escaparHtml(item[relacao.texto])}</option>`;
  });
}

function normalizarBusca(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function configurarBuscaSelect(campoBusca, select, listaSugestoes) {
  const opcoes = [...select.options].map((opcao) => ({
    valor: opcao.value,
    texto: opcao.textContent,
    desabilitada: opcao.disabled,
  }));

  function escolherOpcao(opcao) {
    select.value = opcao.valor;
    campoBusca.value = opcao.texto;
    listaSugestoes.replaceChildren();
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function desenharSugestoes() {
    const termo = normalizarBusca(campoBusca.value.trim());

    const resultados = opcoes.filter(
      (opcao) =>
        !opcao.desabilitada && normalizarBusca(opcao.texto).includes(termo),
    );

    listaSugestoes.replaceChildren();
    resultados.forEach((opcao) => {
      const sugestao = document.createElement("button");

      sugestao.type = "button";
      sugestao.className = "sugestao-autocomplete";
      sugestao.setAttribute("role", "option");
      sugestao.textContent = opcao.texto;
      sugestao.addEventListener("mousedown", (evento) => {
        evento.preventDefault();
        escolherOpcao(opcao);
      });

      listaSugestoes.appendChild(sugestao);
    });
  }

  campoBusca.addEventListener("input", () => {
    select.value = "";

    desenharSugestoes();
  });

  campoBusca.addEventListener("focus", desenharSugestoes);
  campoBusca.addEventListener("blur", () =>
    setTimeout(() => listaSugestoes.replaceChildren(), 150),
  );

  return {
    atualizar() {
      campoBusca.value = select.value
        ? (select.selectedOptions[0]?.textContent ?? "")
        : "";
      listaSugestoes.replaceChildren();
    },
  };
}

function configurarBuscaCliente() {
  if (tabela !== "orcamento") return;

  const busca = document.getElementById("buscaCliente");
  const select = document.getElementById("clienteid");
  const sugestoes = document.getElementById("sugestoesCliente");

  if (!busca || !select || !sugestoes || busca.dataset.configurada) return;

  busca.dataset.configurada = "true";
  buscaCliente = configurarBuscaSelect(busca, select, sugestoes);
}

async function carregarProdutosOrcamento() {
  if (tabela !== "orcamento") return;

  const resposta = await supabaseClient
    .from("produto")
    .select("produtoid, ds_produto, vl_venda_produto, status_produto")
    .eq("status_produto", "ATIVO")
    .order("ds_produto");

  if (resposta.error)
    return avisar("Erro ao carregar produtos: " + resposta.error.message, true);

  produtosOrcamento = resposta.data;

  const parametros = new URLSearchParams(window.location.search);
  const orcamentoId = parametros.get("editar") || parametros.get("duplicar");

  if (orcamentoId) {
    const itens = await supabaseClient
      .from("orcamento_item")
      .select("produtoid")
      .eq("orcamentoid", orcamentoId);

    if (itens.error)
      return avisar(
        "Erro ao carregar produtos do orçamento: " + itens.error.message,
        true,
      );

    const produtosCarregados = new Set(produtosOrcamento.map((produto) => produto.produtoid));
    const idsProdutos = [...new Set(itens.data.map((item) => item.produtoid))]
      .filter((id) => !produtosCarregados.has(id));

    if (idsProdutos.length) {
      const produtosDoOrcamento = await supabaseClient
        .from("produto")
        .select("produtoid, ds_produto, vl_venda_produto, status_produto")
        .in("produtoid", idsProdutos);

      if (produtosDoOrcamento.error)
        return avisar(
          "Erro ao carregar produtos do orçamento: " +
            produtosDoOrcamento.error.message,
          true,
        );

      produtosDoOrcamento.data.forEach((produto) => {
        if (
          !produtosOrcamento.some(
            (produtoAtivo) => produtoAtivo.produtoid === produto.produtoid,
          )
        )
          produtosOrcamento.push(produto);
      });
    }
  }
}

function adicionarItemOrcamento(produtoId = "", quantidade = 1, valorSalvo = null) {
  const listaItens = document.getElementById("itensOrcamento");
  const item = document.createElement("div");

  item.className = "item-orcamento";

  const produto = document.createElement("select");

  produto.className = "produto-orcamento";
  produto.innerHTML = '<option value="" disabled></option>';

  produtosOrcamento
    .filter(
      (produtoBanco) =>
        statusProduto(produtoBanco.status_produto) === "ATIVO" ||
        produtoBanco.produtoid === Number(produtoId),
    )
    .forEach((produtoBanco) => {
      const opcao = document.createElement("option");

      opcao.value = produtoBanco.produtoid;

      const inativo =
        statusProduto(produtoBanco.status_produto) === "INATIVO"
          ? " (Inativo)"
          : "";

      opcao.textContent = `${produtoBanco.ds_produto}${inativo}`;
      produto.appendChild(opcao);
    });

  produto.value = produtoId;

  if (!produto.value) produto.selectedIndex = 0;

  const campoProduto = document.createElement("div");

  campoProduto.className = "campo-autocomplete campo-produto-orcamento";

  const buscaProduto = document.createElement("input");

  buscaProduto.type = "search";
  buscaProduto.placeholder = "Digite para buscar um produto";
  buscaProduto.autocomplete = "off";
  buscaProduto.required = true;
  buscaProduto.setAttribute("aria-label", "Buscar produto");

  const sugestoesProduto = document.createElement("div");

  sugestoesProduto.className = "lista-sugestoes";
  sugestoesProduto.setAttribute("role", "listbox");
  produto.hidden = true;
  campoProduto.append(buscaProduto, sugestoesProduto, produto);

  const buscaProdutoSelect = configurarBuscaSelect(
    buscaProduto,
    produto,
    sugestoesProduto,
  );

  buscaProdutoSelect.atualizar();

  const quantidadeInput = document.createElement("input");

  quantidadeInput.className = "quantidade-orcamento";
  quantidadeInput.type = "number";
  quantidadeInput.min = "1";
  quantidadeInput.value = quantidade;
  quantidadeInput.required = true;
  quantidadeInput.max = "1000000";
  quantidadeInput.step = "1";
  const preco = document.createElement("input");
  preco.className = "valor-orcamento";
  preco.type = "hidden";
  preco.value = valorSalvo ?? "";
  function rotular(texto, elemento) {
    const label = document.createElement("label");
    label.append(texto, elemento);
    return label;
  }

  const remover = document.createElement("button");

  remover.type = "button";
  remover.textContent = "Remover";
  remover.className = "botao-remover-item";
  remover.addEventListener("click", () => {
    if (!confirm("Deseja remover este produto do orçamento?")) return;
    item.remove();
    config.recalcularTotal();
    window.OrcamentoRascunho?.registrar();
  });

  produto.addEventListener("change", () => {
    preco.value = produtosOrcamento.find(p => p.produtoid === Number(produto.value))?.vl_venda_produto ?? "";
    config.recalcularTotal();
  });
  quantidadeInput.addEventListener("input", () => config.recalcularTotal());
  buscaProduto.addEventListener("input", () => config.recalcularTotal());
  item.append(rotular("Descrição", campoProduto), rotular("Quantidade", quantidadeInput), preco, remover);
  listaItens.appendChild(item);
  config.recalcularTotal();
  window.OrcamentoRascunho?.registrar();
}

function lerFormulario() {
  const campos = {};
  config.campos.forEach((campo) => {
    const input = document.getElementById(campo);

    let valor = input.value;

    if (config.camposNumericos?.includes(campo)) {
      valor = valor === "" ? null : Number(valor);
    }

    campos[campo] = valor;
  });

  config.normalizarCampos?.(campos);

  return campos;
}

async function persistirRegistro({ redirecionar = true } = {}) {
  if (config.validarCriacao && !config.validarCriacao()) return;

  if (config.validar && !config.validar()) return;

  const campos = lerFormulario();
  const itens = tabela === "orcamento" ? config.obterItens() : [];

  if (tabela === "produto" && !campos.categoriaprodutoid) {
    return avisar("Escolha uma categoria na lista de sugestões.", true);
  }

  if (
    tabela === "orcamento" &&
    itens.some((item) => !item.produtoid || item.quantidade < 1)
  ) {
    return avisar(
      "Selecione um produto e informe uma quantidade maior que zero.",
      true,
    );
  }

  const id = registroId.value;

  if (id && !config.manterChaveNaEdicao) delete campos[config.chave];

  const resposta = tabela === "orcamento"
    ? await config.salvar(id, campos, itens)
    : id
    ? await supabaseClient.from(tabela).update(campos).eq(config.chave, id)
    : await supabaseClient.from(tabela).insert(campos).select(config.chave).single();

  if (resposta.error)
    return avisar("Erro ao salvar: " + resposta.error.message, true);
  config.aposSalvar?.({ id, campos });
  if (tabela === "orcamento") {
    registroId.value = resposta.data;
  }
  protecaoFormulario()?.salvo({ redirecionar });
  if (redirecionar) window.location.href = `Consulta.html?tipo=${tabela}`;
  return true;
}

async function salvarRegistro(opcoes) {
  if (salvandoRegistro || !formCadastro.reportValidity()) return false;
  salvandoRegistro = true;
  const controles = tabela === "orcamento"
    ? [...formCadastro.elements].map(elemento => [elemento, elemento.disabled]) : [];
  controles.forEach(([elemento]) => { elemento.disabled = true; });
  try {
    return await persistirRegistro(opcoes);
  } catch (erro) {
    avisar("Erro ao salvar: " + erro.message, true);
    return false;
  } finally {
    controles.forEach(([elemento, desabilitado]) => { elemento.disabled = desabilitado; });
    salvandoRegistro = false;
  }
}

formCadastro.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  if (imprimindoOrcamento) return;
  await salvarRegistro();
});

async function salvarEImprimirOrcamento() {
  if (salvandoRegistro || imprimindoOrcamento || !formCadastro.reportValidity()) return;

  // Abre durante o clique para evitar bloqueio de pop-up após a gravação.
  const janela = window.open("about:blank", "_blank");
  if (!janela) {
    avisar("Permita pop-ups para salvar e imprimir o orçamento.", true);
    return;
  }

  imprimindoOrcamento = true;
  const botao = document.getElementById("imprimirOrcamento");
  botao.disabled = true;
  try {
    if (!(await salvarRegistro({ redirecionar: false }))) {
      janela.close();
      return;
    }
    if (!(await config.imprimir(janela))) janela.close();
  } catch (erro) {
    janela.close();
    avisar("O orçamento foi salvo, mas não foi possível imprimir: " + erro.message, true);
  } finally {
    imprimindoOrcamento = false;
    botao.disabled = false;
  }
}

function limparFormulario() {
  if (salvandoRegistro || imprimindoOrcamento) return;
  if (!protecaoFormulario()?.confirmarLimpeza()) return;
  formCadastro.reset();
  registroId.value = "";
  config.preencherCamposPadrao?.();
  config.atualizarBusca?.();

  if (tabela === "orcamento") {
    buscaCliente?.atualizar();
    document.getElementById("itensOrcamento").innerHTML = "";
    config.recalcularTotal();
  }
  protecaoFormulario()?.limpo();
}

async function carregarRegistroParaEditar() {
  const parametros = new URLSearchParams(window.location.search);
  const duplicando = tabela === "orcamento" && !parametros.get("editar") && parametros.has("duplicar");
  const id = parametros.get("editar") || (duplicando ? parametros.get("duplicar") : null);

  if (!id) return;
  if (config.permitirEdicao && !config.permitirEdicao(id)) return;

  const resposta = await supabaseClient
    .from(tabela)
    .select(config.consultaEdicao || [...new Set([config.chave, ...config.campos])].join(", "))
    .eq(config.chave, id)
    .single();

  if (resposta.error) {
    avisar(
      "Erro ao carregar o registro: " + resposta.error.message,
      true,
    );
    return false;
  }

  const registro = config.normalizarRegistro?.(resposta.data) ?? resposta.data;
  registroId.value = registro[config.chave];
  config.campos.forEach((campo) => {
    const input = document.getElementById(campo);

    if (!input) return;

    if (campo.startsWith("dt_"))
      input.value = formatarDataHoraParaCampo(registro[campo]);
    else if (campo === "status_produto")
      input.value = statusProduto(registro[campo]);
    else input.value = registro[campo] ?? "";
  });
  buscaCliente?.atualizar();
  config.atualizarBusca?.();

  if (tabela === "orcamento") {
    const respostaItens = await supabaseClient
      .from("orcamento_item")
      .select("produtoid, qt_produto, vl_unitario")
      .eq("orcamentoid", id);

    if (respostaItens.error) {
      avisar(
        "Erro ao carregar os produtos: " + respostaItens.error.message,
        true,
      );
      return false;
    }

    document.getElementById("itensOrcamento").innerHTML = "";
    respostaItens.data.forEach((item) =>
      adicionarItemOrcamento(item.produtoid, item.qt_produto, item.vl_unitario),
    );

    if (!respostaItens.data.length) config.recalcularTotal();
    if (duplicando) {
      registroId.value = "";
      config.preencherCamposPadrao();
      document.querySelector("h1").textContent = "Duplicar orçamento";
      avisar(`Cópia do orçamento nº ${id}. Confira os dados e salve para gerar um novo número.`);
    }
  }
}

document.getElementById("limpar").addEventListener("click", limparFormulario);

async function iniciar() {
  if (!config) return avisar("Tabela não configurada.", true);

  if (!(await protegerPagina())) return;

  adicionarBarraNavegacao();

  await carregarRelacionamentos();

  configurarBuscaCliente();
  config.iniciar?.();

  await carregarProdutosOrcamento();
  if (await carregarRegistroParaEditar() === false) {
    [...formCadastro.elements].forEach(elemento => { elemento.disabled = true; });
    return;
  }

  config.preencherCamposPadrao?.();
  await protecaoFormulario()?.iniciar();

  document
    .getElementById("adicionarItem")
    ?.addEventListener("click", () => adicionarItemOrcamento());
  document
    .getElementById("imprimirOrcamento")
    ?.addEventListener("click", salvarEImprimirOrcamento);
}

iniciar();
