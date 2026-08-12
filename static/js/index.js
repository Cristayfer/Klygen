const abrir = document.getElementById("abrir");
const modalContainer = document.getElementById("modal-container");

let usuarioLogado = null;

const bandeiras = {
  MG: "/static/img/estados/mg.png",
  BA: "/static/img/estados/ba.png",
  PE: "/static/img/estados/pe.png",
  ES: "/static/img/estados/es.png",
};

if (abrir) {
  abrir.addEventListener("click", async () => {
    try {
      const resposta = await fetch("/nova-tarefa");

      if (!resposta.ok) {
        console.error("Não foi possível carregar a nova tarefa.");
        return;
      }

      const html = await resposta.text();

      modalContainer.innerHTML = html;

      const campoData = document.getElementById("data");

      if (campoData) {
        const hoje = new Date();

        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, "0");
        const dia = String(hoje.getDate()).padStart(2, "0");

        campoData.value = `${dia}/${mes}/${ano}`;
      }

      const fechar = document.getElementById("cancelar");

      if (fechar) {
        fechar.addEventListener("click", () => {
          modalContainer.innerHTML = "";
        });
      }

      const formulario = document.getElementById("task-form");

      if (!formulario) {
        console.error("Formulário de tarefa não encontrado.");
        return;
      }

      formulario.addEventListener("submit", async (event) => {
        event.preventDefault();

        const titulo = document.getElementById("titulo").value;
        const descricao = document.getElementById("descricao").value;
        const prioridade = document.getElementById("prioridade").value;
        const estado = document.getElementById("estado").value;
        const data = document.getElementById("data").value;

        const solicitante = usuarioLogado
          ? usuarioLogado.usuario
          : document.getElementById("solicitante")?.value || "";

        const anexo = document.getElementById("anexo");

        const arquivos = anexo ? Array.from(anexo.files) : [];

        if (!titulo || !prioridade || !estado || !data) {
          alert("Preencha todos os campos obrigatórios.");

          return;
        }

        try {
          const resposta = await fetch("/api/tarefas", {
            method: "POST",

            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify({
              titulo: titulo,
              descricao: descricao,
              prioridade: prioridade,
              estado: estado,
              data: data,
              solicitante: solicitante,
            }),
          });

          const resultado = await resposta.json();

          console.log("RESPOSTA DO FLASK:", resultado);

          if (!resposta.ok) {
            alert(resultado.mensagem || "Não foi possível criar a tarefa.");

            return;
          }

          console.log("CRIANDO CARD NO JAVASCRIPT");

          criarTarefa(
            titulo,
            descricao,
            prioridade,
            data,
            estado,
            solicitante,
            arquivos,
            resultado.id || null,
          );

          modalContainer.innerHTML = "";
        } catch (erro) {
          console.error("ERRO AO CRIAR TAREFA:", erro);

          alert("Erro ao criar a tarefa.");
        }
      });
    } catch (erro) {
      console.error("ERRO AO ABRIR NOVA TAREFA:", erro);
    }
  });
}

async function carregarUsuarioLogado() {
  try {
    const resposta = await fetch("/api/usuario-logado");

    if (!resposta.ok) {
      console.error("Não foi possível carregar o usuário logado.");

      return;
    }

    const resultado = await resposta.json();

    const usuario = resultado.usuario;

    usuarioLogado = usuario;

    console.log("USUÁRIO LOGADO:", usuarioLogado);

    const nome = document.getElementById("perfil-nome");

    const tipo = document.getElementById("perfil-tipo");

    const iniciais = document.getElementById("perfil-iniciais");

    const avatar = document.getElementById("perfil-avatar");

    if (nome) {
      nome.textContent = usuario.nome;
    }

    if (tipo) {
      if (usuario.administrador) {
        tipo.textContent = "Administrador";
      } else if (usuario.pode_resolver) {
        tipo.textContent = "Usuário";
      } else {
        tipo.textContent = "Solicitante";
      }
    }

    if (avatar) {
      if (usuario.foto) {
        avatar.innerHTML = "";

        const imagem = document.createElement("img");

        imagem.src = usuario.foto;

        imagem.alt = "Foto de perfil";

        avatar.appendChild(imagem);
      } else {
        avatar.innerHTML = `
                    <span id="perfil-iniciais">
                        ${obterIniciais(usuario.nome)}
                    </span>
                `;
      }
    }
  } catch (erro) {
    console.error("ERRO AO CARREGAR USUÁRIO:", erro);
  }
}

carregarUsuarioLogado();

function obterIniciais(nome) {
  if (!nome) {
    return "--";
  }

  const partes = nome.trim().split(/\s+/);

  if (partes.length >= 2) {
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }

  return partes[0].substring(0, 2).toUpperCase();
}

async function abrirMeuPerfil() {
  const container = document.getElementById("details-modal-container");

  try {
    const resposta = await fetch("/meu-perfil");

    if (!resposta.ok) {
      console.error("Não foi possível carregar o perfil.");

      return;
    }

    const html = await resposta.text();

    container.innerHTML = `
            <div class="perfil-overlay">
                ${html}
            </div>
        `;

    container.style.display = "flex";

    const usuarioResposta = await fetch("/api/usuario-logado");

    if (!usuarioResposta.ok) {
      console.error("Não foi possível carregar os dados do usuário.");

      return;
    }

    const resultado = await usuarioResposta.json();

    const usuario = resultado.usuario;

    usuarioLogado = usuario;

    const nome = document.getElementById("perfil-dado-nome");

    const usuarioElemento = document.getElementById("perfil-dado-usuario");

    const ramal = document.getElementById("perfil-dado-ramal");

    const tipo = document.getElementById("perfil-dado-tipo");

    const fotoGrande = document.getElementById("perfil-foto-grande");

    const alterarFoto = document.getElementById("alterar-foto");

    const removerFoto = document.getElementById("remover-foto");

    const inputFoto = document.getElementById("input-foto");

    if (nome) {
      nome.textContent = usuario.nome;
    }

    if (usuarioElemento) {
      usuarioElemento.textContent = usuario.usuario;
    }

    if (ramal) {
      ramal.textContent = usuario.ramal || "Não informado";
    }

    if (tipo) {
      if (usuario.administrador) {
        tipo.textContent = "Administrador";
      } else if (usuario.pode_resolver) {
        tipo.textContent = "Usuário";
      } else {
        tipo.textContent = "Solicitante";
      }
    }

    // ====================================================
    // FOTO GRANDE
    // ====================================================

    if (fotoGrande) {
      if (usuario.foto) {
        fotoGrande.innerHTML = "";

        const imagem = document.createElement("img");

        imagem.src = usuario.foto;

        imagem.alt = "Foto de perfil";

        fotoGrande.appendChild(imagem);
      } else {
        fotoGrande.innerHTML = `
                    <span id="perfil-foto-iniciais">
                        ${obterIniciais(usuario.nome)}
                    </span>
                `;
      }
    }

    // ====================================================
    // ALTERAR FOTO
    // ====================================================

    if (alterarFoto && inputFoto) {
      alterarFoto.addEventListener("click", () => {
        inputFoto.click();
      });
    }

    if (inputFoto) {
      inputFoto.addEventListener("change", async () => {
        const arquivo = inputFoto.files[0];

        if (!arquivo) {
          return;
        }

        const dados = new FormData();

        dados.append("foto", arquivo);

        try {
          const resposta = await fetch("/api/usuario-logado/foto", {
            method: "POST",
            body: dados,
          });

          const resultado = await resposta.json();

          if (!resposta.ok) {
            console.error("ERRO AO ALTERAR FOTO:", resultado);

            alert(resultado.mensagem || "Não foi possível alterar a foto.");

            return;
          }

          console.log("FOTO ALTERADA:", resultado);

          const cache = "?t=" + new Date().getTime();

          // FOTO GRANDE

          if (fotoGrande) {
            fotoGrande.innerHTML = "";

            const imagem = document.createElement("img");

            imagem.src = resultado.foto + cache;

            imagem.alt = "Foto de perfil";

            fotoGrande.appendChild(imagem);
          }

          // FOTO SIDEBAR

          const avatar = document.getElementById("perfil-avatar");

          if (avatar) {
            avatar.innerHTML = "";

            const imagemAvatar = document.createElement("img");

            imagemAvatar.src = resultado.foto + cache;

            imagemAvatar.alt = "Foto de perfil";

            avatar.appendChild(imagemAvatar);
          }

          // Atualiza usuário local

          usuarioLogado.foto = resultado.foto;
        } catch (erro) {
          console.error("ERRO AO ALTERAR FOTO:", erro);
        }
      });
    }

    // ====================================================
    // REMOVER FOTO
    // ====================================================

    if (removerFoto) {
      removerFoto.addEventListener("click", async () => {
        try {
          const respostaRemover = await fetch("/api/usuario-logado/foto", {
            method: "DELETE",
          });

          const resultadoRemover = await respostaRemover.json();

          if (!respostaRemover.ok) {
            console.error("ERRO AO REMOVER FOTO:", resultadoRemover);

            alert(
              resultadoRemover.mensagem || "Não foi possível remover a foto.",
            );

            return;
          }

          console.log("FOTO REMOVIDA:", resultadoRemover);

          // FOTO GRANDE

          if (fotoGrande) {
            fotoGrande.innerHTML = `
                                <span id="perfil-foto-iniciais">
                                    ${obterIniciais(usuario.nome)}
                                </span>
                            `;
          }

          // FOTO SIDEBAR

          const avatar = document.getElementById("perfil-avatar");

          if (avatar) {
            avatar.innerHTML = `
                                <span id="perfil-iniciais">
                                    ${obterIniciais(usuario.nome)}
                                </span>
                            `;
          }

          // Atualiza usuário local

          usuarioLogado.foto = null;
        } catch (erro) {
          console.error("ERRO AO REMOVER FOTO:", erro);
        }
      });
    }

    const fechar = document.getElementById("fechar-perfil");

    if (fechar) {
      fechar.addEventListener("click", () => {
        container.innerHTML = "";

        container.style.display = "none";
      });
    }
  } catch (erro) {
    console.error("ERRO AO ABRIR MEU PERFIL:", erro);
  }
}

const perfilUsuario = document.getElementById("perfil-usuario");

if (perfilUsuario) {
  perfilUsuario.addEventListener("click", abrirMeuPerfil);
}

async function carregarTarefas() {
  try {
    const resposta = await fetch("/api/tarefas");

    if (!resposta.ok) {
      console.error("Não foi possível carregar as tarefas.");

      return;
    }

    const resultado = await resposta.json();

    console.log("TAREFAS DO BANCO:", resultado);

    console.log("LISTA DE TAREFAS:", resultado.tarefas);

    resultado.tarefas.forEach((tarefa) => {
      criarTarefa(
        tarefa.titulo,
        tarefa.descricao,
        tarefa.prioridade,
        tarefa.data,
        tarefa.estado,
        tarefa.solicitante,
        [],
        tarefa.id,
        tarefa.status,
        tarefa.responsavel,
      );
    });
  } catch (erro) {
    console.error("ERRO AO CARREGAR TAREFAS:", erro);
  }
}

async function buscarUsuario(usuario) {
  if (!usuario) {
    return null;
  }

  try {
    console.log("BUSCANDO USUÁRIO:", usuario);

    // Primeiro verifica se é o próprio usuário logado

    if (usuarioLogado && usuarioLogado.usuario === usuario) {
      return usuarioLogado;
    }

    const resposta = await fetch(
      `/api/usuarios/${encodeURIComponent(usuario)}`,
    );

    console.log("STATUS DA BUSCA:", resposta.status);

    if (resposta.ok) {
      const resultado = await resposta.json();

      return resultado.usuario;
    }

    console.error("Usuário não encontrado:", usuario);

    return null;
  } catch (erro) {
    console.error("ERRO AO BUSCAR USUÁRIO:", erro);

    return null;
  }
}

function criarAvatarUsuario(usuario, tamanho = "normal") {
  if (!usuario) {
    return `
            <div class="usuario-avatar ${tamanho}">
                ?
            </div>
        `;
  }

  const iniciais = obterIniciais(usuario.nome);

  if (usuario.foto) {
    return `
            <div class="usuario-avatar ${tamanho}">
                <img
                    src="${usuario.foto}"
                    alt="${usuario.nome}"
                >
            </div>
        `;
  }

  return `
        <div class="usuario-avatar ${tamanho}">
            ${iniciais}
        </div>
    `;
}

async function criarTarefa(
  titulo,
  descricao,
  prioridade,
  data,
  estado,
  solicitante,
  arquivos,
  id = null,
  status = "pending",
  responsavel = "",
) {
  const usuarioSolicitante = await buscarUsuario(solicitante);

  const coluna = document.querySelector(`.column[data-status="${status}"]`);

  if (!coluna) {
    console.error("Coluna não encontrada:", status);

    return;
  }

  const taskList = coluna.querySelector(".task-list");

  if (!taskList) {
    console.error("Lista de tarefas não encontrada.");

    return;
  }

  const card = document.createElement("div");

  card.classList.add("card", `priority-${prioridade}`);

  card.dataset.id = id;

  card.dataset.status = status;

  card.dataset.responsavel = responsavel;

  card.addEventListener("click", () => {
    abrirDetalhes(
      card,
      titulo,
      descricao,
      prioridade,
      estado,
      data,
      solicitante,
      arquivos,
    );
  });

  let nomePrioridade = "";

  if (prioridade === "high") {
    nomePrioridade = "Alta";
  } else if (prioridade === "medium") {
    nomePrioridade = "Média";
  } else if (prioridade === "low") {
    nomePrioridade = "Baixa";
  }

  const dataFormatada = formatarData(data);

  const bandeiraEstado = bandeiras[estado];

  card.dataset.titulo = titulo;

  card.dataset.descricao = descricao;

  card.dataset.prioridade = prioridade;

  card.dataset.data = data;

  card.dataset.estado = estado;

  card.dataset.solicitante = solicitante;

  const avatarSolicitante = criarAvatarUsuario(usuarioSolicitante, "small");

  card.innerHTML = `
        <span class="badge priority-${prioridade}">
            ${nomePrioridade}
        </span>

        <h4>${titulo}</h4>

        <div class="card-footer">

            <span class="card-date">
                📅 ${dataFormatada}
            </span>

            <div class="card-state">

                <img
                    src="${bandeiraEstado}"
                    alt="${estado}"
                >

                <span>
                    ${estado}
                </span>

            </div>

            ${avatarSolicitante}

        </div>
    `;

  taskList.appendChild(card);

  atualizarContadores();
}

async function atualizarStatusBanco(id, status, responsavel = "") {
  try {
    const resposta = await fetch(`/api/tarefas/${id}/status`, {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        status: status,

        responsavel: responsavel,
      }),
    });

    const resultado = await resposta.json();

    console.log("STATUS ATUALIZADO NO BANCO:", resultado);

    if (!resposta.ok) {
      console.error("Erro ao atualizar status:", resultado);

      return false;
    }

    return true;
  } catch (erro) {
    console.error("ERRO AO ATUALIZAR STATUS:", erro);

    return false;
  }
}

async function abrirDetalhes(
  card,
  titulo,
  descricao,
  prioridade,
  estado,
  data,
  solicitante,
  arquivos,
) {
  const detailsContainer = document.getElementById("details-modal-container");

  detailsContainer.style.display = "flex";

  const responsavel = card.dataset.responsavel || "";

  const usuarioSolicitante = await buscarUsuario(solicitante);

  const usuarioResponsavel = responsavel
    ? await buscarUsuario(responsavel)
    : null;

  console.log("STATUS DO CARD:", card.dataset.status);

  let nomePrioridade = "";

  if (prioridade === "high") {
    nomePrioridade = "Alta";
  } else if (prioridade === "medium") {
    nomePrioridade = "Média";
  } else if (prioridade === "low") {
    nomePrioridade = "Baixa";
  }

  let nomeStatus = "Pendências";

  if (card.dataset.status === "progress") {
    nomeStatus = "Em andamento";
  } else if (card.dataset.status === "ready") {
    nomeStatus = "Pronto";
  } else if (card.dataset.status === "review") {
    nomeStatus = "Revisão";
  } else if (card.dataset.status === "completed") {
    nomeStatus = "Concluído";
  }

  let listaArquivos = "";

  if (arquivos && arquivos.length > 0) {
    for (const arquivo of arquivos) {
      listaArquivos += `
                <div class="attachment">
                    📎 ${arquivo.name}
                </div>
            `;
    }
  } else {
    listaArquivos = `
            <p class="no-attachments">
                Nenhum arquivo anexado.
            </p>
        `;
  }

  let htmlResponsavel;

  if (usuarioResponsavel) {
    htmlResponsavel = `
            <div class="details-user">

                ${criarAvatarUsuario(usuarioResponsavel, "small")}

                <strong>
                    ${usuarioResponsavel.nome}
                </strong>

            </div>
        `;
  } else {
    htmlResponsavel = `
            <div class="details-user">

                <div class="details-avatar">
                    <span>--</span>
                </div>

                <strong>
                    Ainda não atribuído
                </strong>

            </div>
        `;
  }

  detailsContainer.innerHTML = `

        <div class="details-modal">

            <div class="details-header">

                <div>

                    <span class="details-label">
                        SOLICITAÇÃO
                    </span>

                    <h2>
                        ${titulo}
                    </h2>

                </div>

                <button
                    id="fechar-detalhes"
                >
                    &times;
                </button>

            </div>


            <div class="details-body">


                <div class="details-section">

                    <h3>
                        Descrição
                    </h3>

                    <div class="description">

                        ${descricao || "Nenhuma descrição informada."}

                    </div>

                </div>


                <div class="details-section">

                    <h3>
                        Anexos
                    </h3>

                    <div class="attachments">

                        ${listaArquivos}

                    </div>

                </div>


                <div class="details-info">


                    <div class="info-item">

                        <span>
                            Prioridade
                        </span>

                        <strong>
                            ${nomePrioridade}
                        </strong>

                    </div>


                    <div class="info-item">

                        <span>
                            Estado
                        </span>

                        <div class="details-state">

                            <img
                                src="${bandeiras[estado]}"
                                alt="${estado}"
                            >

                            <strong>
                                ${estado}
                            </strong>

                        </div>

                    </div>


                    <div class="info-item">

                        <span>
                            Data de Solicitação
                        </span>

                        <strong>
                            ${data}
                        </strong>

                    </div>


                    <div class="info-item">

                        <span>
                            Solicitante
                        </span>

                        <div class="usuario-detalhe">

                            ${criarAvatarUsuario(usuarioSolicitante)}

                            <strong>

                                ${
                                  usuarioSolicitante
                                    ? usuarioSolicitante.nome
                                    : solicitante
                                }

                            </strong>

                        </div>

                    </div>


                    <div class="info-item">

                        <span>
                            Responsável
                        </span>

                        ${htmlResponsavel}

                    </div>


                    <div class="info-item">

                        <span>
                            Status
                        </span>

                        <strong>
                            ${nomeStatus}
                        </strong>

                    </div>


                </div>


                <div class="details-actions">


                    ${
                      card.dataset.status === "pending"
                        ? `
                                <button
                                    id="assumir-tarefa"
                                    class="btn-assume"
                                >
                                    Assumir Tarefa
                                </button>
                            `
                        : ""
                    }


                    ${
                      card.dataset.status === "progress"
                        ? `
                                <button
                                    id="finalizar-tarefa"
                                    class="btn-assume"
                                >
                                    Finalizar Tarefa
                                </button>
                            `
                        : ""
                    }


                    ${
                      card.dataset.status === "ready"
                        ? `
                                <button
                                    id="concluir-tarefa"
                                    class="btn-assume"
                                >
                                    Marcar como Concluída
                                </button>

                                <button
                                    id="revisar-tarefa"
                                    class="btn-review"
                                >
                                    Não foi resolvido
                                </button>
                            `
                        : ""
                    }


                    ${
                      card.dataset.status === "review"
                        ? `
                                <button
                                    id="retomar-tarefa"
                                    class="btn-assume"
                                >
                                    Retomar Tarefa
                                </button>
                            `
                        : ""
                    }


                </div>

            </div>

        </div>
    `;

  const fechar = document.getElementById("fechar-detalhes");

  if (fechar) {
    fechar.addEventListener("click", () => {
      detailsContainer.innerHTML = "";

      detailsContainer.style.display = "none";
    });
  }

  const assumir = document.getElementById("assumir-tarefa");

  if (assumir) {
    assumir.addEventListener("click", async () => {
      if (!usuarioLogado) {
        alert("Não foi possível identificar o usuário logado.");

        return;
      }

      const usuarioAtual = usuarioLogado.usuario;

      const colunaAndamento = document.querySelector(
        '.column[data-status="progress"] .task-list',
      );

      if (!colunaAndamento) {
        console.error("Coluna Em andamento não encontrada.");

        return;
      }

      card.dataset.status = "progress";

      card.dataset.responsavel = usuarioAtual;

      colunaAndamento.appendChild(card);

      await atualizarStatusBanco(card.dataset.id, "progress", usuarioAtual);

      atualizarContadores();

      detailsContainer.innerHTML = "";

      detailsContainer.style.display = "none";
    });
  }

  const finalizar = document.getElementById("finalizar-tarefa");

  if (finalizar) {
    finalizar.addEventListener("click", async () => {
      const colunaPronto = document.querySelector(
        '.column[data-status="ready"]',
      );

      if (!colunaPronto) {
        console.error("Coluna Pronto não encontrada.");

        return;
      }

      const listaPronto = colunaPronto.querySelector(".task-list");

      if (!listaPronto) {
        console.error("Lista da coluna Pronto não encontrada.");

        return;
      }

      card.dataset.status = "ready";

      listaPronto.appendChild(card);

      await atualizarStatusBanco(
        card.dataset.id,
        "ready",
        card.dataset.responsavel,
      );

      atualizarContadores();

      detailsContainer.innerHTML = "";

      detailsContainer.style.display = "none";
    });
  }

  const concluir = document.getElementById("concluir-tarefa");

  if (concluir) {
    concluir.addEventListener("click", async () => {
      const colunaConcluido = document.querySelector(
        '.column[data-status="completed"]',
      );

      if (!colunaConcluido) {
        console.error("Coluna Concluído não encontrada.");

        return;
      }

      const listaConcluido = colunaConcluido.querySelector(".task-list");

      if (!listaConcluido) {
        console.error("Lista da coluna Concluído não encontrada.");

        return;
      }

      card.dataset.status = "completed";

      listaConcluido.appendChild(card);

      await atualizarStatusBanco(
        card.dataset.id,
        "completed",
        card.dataset.responsavel,
      );

      atualizarContadores();

      detailsContainer.innerHTML = "";

      detailsContainer.style.display = "none";
    });
  }

  const revisar = document.getElementById("revisar-tarefa");

  if (revisar) {
    revisar.addEventListener("click", async () => {
      const colunaRevisao = document.querySelector(
        '.column[data-status="review"]',
      );

      if (!colunaRevisao) {
        console.error("Coluna Revisão não encontrada.");

        return;
      }

      const listaRevisao = colunaRevisao.querySelector(".task-list");

      if (!listaRevisao) {
        console.error("Lista da coluna Revisão não encontrada.");

        return;
      }

      card.dataset.status = "review";

      listaRevisao.appendChild(card);

      await atualizarStatusBanco(
        card.dataset.id,
        "review",
        card.dataset.responsavel,
      );

      atualizarContadores();

      detailsContainer.innerHTML = "";

      detailsContainer.style.display = "none";
    });
  }

  const retomar = document.getElementById("retomar-tarefa");

  if (retomar) {
    retomar.addEventListener("click", async () => {
      const colunaAndamento = document.querySelector(
        '.column[data-status="progress"] .task-list',
      );

      if (!colunaAndamento) {
        console.error("Coluna Em andamento não encontrada.");

        return;
      }

      card.dataset.status = "progress";

      colunaAndamento.appendChild(card);

      await atualizarStatusBanco(
        card.dataset.id,
        "progress",
        card.dataset.responsavel,
      );

      atualizarContadores();

      detailsContainer.innerHTML = "";

      detailsContainer.style.display = "none";
    });
  }
}

function atualizarContadores() {
  const colunas = document.querySelectorAll(".column");

  colunas.forEach((coluna) => {
    const contador = coluna.querySelector(".task-count");

    const tarefas = coluna.querySelectorAll(".task-list .card");

    if (contador) {
      contador.textContent = tarefas.length;
    }
  });
}

function formatarData(data) {
  if (!data) {
    return "";
  }

  const partes = data.split("/");

  if (partes.length < 2) {
    return data;
  }

  const dia = partes[0];

  const mes = partes[1];

  const meses = {
    "01": "Jan",
    "02": "Fev",
    "03": "Mar",
    "04": "Abr",
    "05": "Mai",
    "06": "Jun",
    "07": "Jul",
    "08": "Ago",
    "09": "Set",
    10: "Out",
    11: "Nov",
    12: "Dez",
  };

  return `${dia} ${meses[mes] || mes}`;
}

carregarTarefas();
