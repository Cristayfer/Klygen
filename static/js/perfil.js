function configurarFotoPerfil() {
  const btnAlterarFoto = document.getElementById("alterar-foto");
  const inputFoto = document.getElementById("input-foto");
  const fotoGrande = document.getElementById("perfil-foto-grande");
  const iniciaisFoto = document.getElementById("perfil-foto-iniciais");

  if (!btnAlterarFoto || !inputFoto || !fotoGrande) {
    console.error("Elementos da foto de perfil não encontrados.");
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

    // Mostra a imagem imediatamente no perfil
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

    // Envia a imagem para o Flask
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
    } catch (erro) {
      console.error("ERRO AO ENVIAR FOTO:", erro);
      alert("Erro ao salvar a foto.");
    }
  });
}
