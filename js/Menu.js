async function protegerMenu() {
  if (!sessionStorage.getItem("usuarioLogado"))
    window.location.href = "index.html";
  if (sessionStorage.getItem("usuarioLogado") !== "ADMIN")
    document.querySelector(".criar-usuarios")?.remove();
}

async function sair() {
  sessionStorage.removeItem("usuarioLogado");
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

document.getElementById("botaoSair").addEventListener("click", sair);
configurarBarraMobile();
protegerMenu();
