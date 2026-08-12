async function carregarEquipe() {
  try {
    const resposta = await fetch("/api/usuarios");
    if (!resposta.ok) {
      throw new Error("Erro ao buscar usuários.");
    }
    const dados = await resposta.json();

    const listaEquipe = document.getElementById("lista-equipe");

    listaEquipe.innerHTML = "";

    if (dados.usuarios.length === 0) {
      listaEquipe.innerHTML = `
                <p class="equipe-vazia">
                    Nenhum usuário cadastrado.
                </p>
            `;

      return;
    }

    dados.usuarios.forEach((usuario) => {
      const card = document.createElement("div");

      card.classList.add("usuario-card");

      const iniciais = usuario.nome
        .split(" ")
        .map((nome) => nome[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

      let tipoUsuario = "Usuário comum";

      if (usuario.administrador) {
        tipoUsuario = "Administrador";
      } else if (usuario.pode_resolver) {
        tipoUsuario = "Executor";
      }

      const status = usuario.ativo ? "Ativo" : "Inativo";

      const classeStatus = usuario.ativo ? "status-ativo" : "status-inativo";

      card.innerHTML = `
                <div class="usuario-avatar">
                    ${
                      usuario.foto
                        ? `<img src="/static/img/usuarios/${usuario.foto}" alt="${usuario.nome}">`
                        : `<span>${iniciais}</span>`
                    }
                </div>
                <div class="usuario-info">
                    <h3>${usuario.nome}</h3>
                    <p class="usuario-tipo">
                        ${tipoUsuario}
                    </p>
                    <p class="usuario-ramal">
                        Ramal: ${usuario.ramal || "Não informado"}
                    </p>
                </div>
                <div class="usuario-status ${classeStatus}">
                    ${status}
                </div>
            `;
      listaEquipe.appendChild(card);
    });
  } catch (erro) {
    console.error("Erro ao carregar equipe:", erro);
  }
}

carregarEquipe();
