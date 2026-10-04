function configurarFotoPerfil() {
  const btnAlterarFoto = document.getElementById("alterar-foto");
  const inputFoto = document.getElementById("input-foto");
  const fotoGrande = document.getElementById("perfil-foto-grande");
  const iniciaisFoto = document.getElementById("perfil-foto-iniciais");

  if (!btnAlterarFoto || !inputFoto || !fotoGrande) {
    return;
  }

  btnAlterarFoto.addEventListener("click", () => {
    inputFoto.click();
  });

  inputFoto.addEventListener("change", async () => {
    const arquivo = inputFoto.files[0];

    if (!arquivo) {
      return;
    }

    if (!arquivo.type.startsWith("image/")) {
      alert("Selecione uma imagem válida.");
      inputFoto.value = "";
      return;
    }

    const leitor = new FileReader();

    leitor.onload = function (evento) {
      fotoGrande.innerHTML = "";

      const imagem = document.createElement("img");

      imagem.src = evento.target.result;
      imagem.alt = "Foto de perfil";

      fotoGrande.appendChild(imagem);

      if (iniciaisFoto) {
        iniciaisFoto.style.display = "none";
      }
    };

    leitor.readAsDataURL(arquivo);

    const formulario = new FormData();

    formulario.append("foto", arquivo);

    try {
      const resposta = await fetch("/api/usuario/foto", {
        method: "POST",
        body: formulario,
      });

      const resultado = await resposta.json();

      console.log("RESPOSTA DA FOTO:", resultado);

      if (!resposta.ok || !resultado.sucesso) {
        alert(resultado.mensagem || "Não foi possível salvar a foto.");
        return;
      }

      console.log("FOTO SALVA COM SUCESSO!");

      // Atualiza a foto da sidebar
      const avatar = document.getElementById("perfil-avatar");

      if (avatar && resultado.foto) {
        avatar.innerHTML = "";

        const imagemAvatar = document.createElement("img");

        imagemAvatar.src = resultado.foto + "?t=" + new Date().getTime();
        imagemAvatar.alt = "Foto de perfil";

        avatar.appendChild(imagemAvatar);
      }
    } catch (erro) {
      console.error("ERRO AO ENVIAR FOTO:", erro);
      alert("Erro ao salvar foto.");
    }
  });
}

function configurarEdicaoNome() {
  const botao = document.getElementById("editar-nome");
  const campo = document.getElementById("perfil-dado-nome");

  if (!botao || !campo) {
    return;
  }

  botao.addEventListener("click", () => {
    const nomeAtual = campo.textContent.trim();

    campo.innerHTML = `
      <input
        type="text"
        id="input-editar-nome"
        class="input-editar-perfil"
        value="${nomeAtual}"
      >
      <button
        type="button"
        id="salvar-nome"
        class="btn-salvar-campo"
      >
        Salvar
      </button>
      <button
        type="button"
        id="cancelar-nome"
        class="btn-cancelar-campo"
      >
        Cancelar
      </button>
    `;

    botao.style.display = "none";

    const input = document.getElementById("input-editar-nome");
    const salvar = document.getElementById("salvar-nome");
    const cancelar = document.getElementById("cancelar-nome");

    input.focus();

    salvar.addEventListener("click", async () => {
      const novoNome = input.value.trim();

      if (!novoNome) {
        alert("Informe um nome.");
        input.focus();
        return;
      }

      try {
        const resposta = await fetch("/api/usuario-logado", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nome: novoNome,
          }),
        });

        const resultado = await resposta.json();

        if (!resposta.ok || !resultado.sucesso) {
          alert(resultado.mensagem || "Não foi possível atualizar o nome.");
          return;
        }

        campo.innerHTML = "";
        campo.textContent = novoNome;

        botao.style.display = "inline-flex";

        const nomeSidebar = document.getElementById("perfil-nome");

        if (nomeSidebar) {
          nomeSidebar.textContent = novoNome;
        }

        console.log("NOME ATUALIZADO:", resultado);
      } catch (erro) {
        console.error("ERRO AO ATUALIZAR NOME:", erro);
        alert("Erro ao atualizar o nome.");
      }
    });

    cancelar.addEventListener("click", () => {
      campo.textContent = nomeAtual;
      botao.style.display = "inline-flex";
    });
  });
}

function configurarEdicaoRamal() {
  const botao = document.getElementById("editar-ramal");
  const campo = document.getElementById("perfil-dado-ramal");

  if (!botao || !campo) {
    return;
  }

  botao.addEventListener("click", () => {
    const ramalAtual = campo.textContent.trim();

    const valorInicial = ramalAtual === "Não informado" ? "" : ramalAtual;

    campo.innerHTML = `
      <input
        type="text"
        id="input-editar-ramal"
        class="input-editar-perfil"
        value="${valorInicial}"
        maxlength="10"
      >
      <button
        type="button"
        id="salvar-ramal"
        class="btn-salvar-campo"
      >
        Salvar
      </button>
      <button
        type="button"
        id="cancelar-ramal"
        class="btn-cancelar-campo"
      >
        Cancelar
      </button>
    `;

    botao.style.display = "none";

    const input = document.getElementById("input-editar-ramal");
    const salvar = document.getElementById("salvar-ramal");
    const cancelar = document.getElementById("cancelar-ramal");

    input.focus();

    salvar.addEventListener("click", async () => {
      const novoRamal = input.value.trim();

      try {
        const resposta = await fetch("/api/usuario-logado", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ramal: novoRamal,
          }),
        });

        const resultado = await resposta.json();

        if (!resposta.ok || !resultado.sucesso) {
          alert(resultado.mensagem || "Não foi possível atualizar o ramal.");
          return;
        }

        campo.textContent = novoRamal || "Não informado";

        botao.style.display = "inline-flex";

        console.log("RAMAL ATUALIZADO:", resultado);
      } catch (erro) {
        console.error("ERRO AO ATUALIZAR RAMAL:", erro);
        alert("Erro ao atualizar o ramal.");
      }
    });

    cancelar.addEventListener("click", () => {
      campo.textContent = ramalAtual;
      botao.style.display = "inline-flex";
    });
  });
}

function configurarPerfil() {
  configurarFotoPerfil();
  configurarEdicaoNome();
  configurarEdicaoRamal();
}
