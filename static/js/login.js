const formulario = document.getElementById("login-form");
const mensagem = document.getElementById("mensagem");

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const usuario = document.getElementById("usuario").value.trim();
  const senha = document.getElementById("senha").value;

  mensagem.textContent = "";

  try {
    const resposta = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        usuario: usuario,
        senha: senha,
      }),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      mensagem.textContent = dados.mensagem;
      return;
    }

    window.location.href = "/";
  } catch (erro) {
    console.error(erro);

    mensagem.textContent = "Não foi possível realizar o login.";
  }
});
