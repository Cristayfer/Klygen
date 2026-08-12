const formulario = document.getElementById("cadastro-form");
const mensagem = document.getElementById("mensagem");

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const nome = document.getElementById("nome").value.trim();
  const usuario = document.getElementById("usuario").value.trim();
  const senha = document.getElementById("senha").value;
  const confirmarSenha = document.getElementById("confirmar-senha").value;

  mensagem.textContent = "";

  if (senha !== confirmarSenha) {
    mensagem.textContent = "As senhas não coincidem.";
    return;
  }

  try {
    const resposta = await fetch("/api/cadastro", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nome: nome,
        usuario: usuario,
        senha: senha,
      }),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      mensagem.textContent = dados.mensagem;
      return;
    }

    mensagem.textContent = dados.mensagem;

    formulario.reset();

    setTimeout(() => {
      window.location.href = "/login";
    }, 1200);
  } catch (erro) {
    console.error(erro);

    mensagem.textContent = "Não foi possível criar a conta.";
  }
});
