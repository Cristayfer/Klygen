let tarefas = [];

async function carregarSolicitacoes() {
  const lista = document.getElementById("lista-solicitacoes");
  const total = document.getElementById("total-solicitacoes");
  const atualizacao = document.getElementById("ultima-atualizacao");

  try {
    const resposta = await fetch("/api/solicitacoes");

    if (!resposta.ok) {
      throw new Error("Erro ao buscar solicitações.");
    }

    tarefas = await resposta.json();

    console.log("SOLICITAÇÕES RECEBIDAS:", tarefas);

    total.textContent = tarefas.length;

    const agora = new Date();

    atualizacao.textContent = `Atualizado às ${agora.toLocaleTimeString(
      "pt-BR",
      {
        hour: "2-digit",
        minute: "2-digit",
      },
    )}`;

    renderizarSolicitacoes(tarefas);
  } catch (erro) {
    console.error(erro);

    lista.innerHTML = `
            <div class="solicitacoes-erro">

                <h3>Não foi possível carregar as solicitações.</h3>

                <p>
                    Verifique se o servidor Flask está funcionando.
                </p>

            </div>
        `;
  }
}

function renderizarSolicitacoes(listaTarefas) {
  const lista = document.getElementById("lista-solicitacoes");

  lista.innerHTML = "";

  if (listaTarefas.length === 0) {
    lista.innerHTML = `
            <div class="solicitacoes-vazio">

                <div class="solicitacoes-vazio-icon">
                    ✓
                </div>

                <h3>Nenhuma solicitação encontrada</h3>

                <p>
                    Tente alterar os filtros ou a busca.
                </p>

            </div>
        `;

    return;
  }

  listaTarefas.forEach((tarefa) => {
    let nomePrioridade = "";
    let classePrioridade = "";

    if (tarefa.prioridade === "high") {
      nomePrioridade = "Alta";
      classePrioridade = "high";
    } else if (tarefa.prioridade === "medium") {
      nomePrioridade = "Média";
      classePrioridade = "medium";
    } else {
      nomePrioridade = "Baixa";
      classePrioridade = "low";
    }

    const card = document.createElement("div");

    card.classList.add("solicitacao-item", `solicitacao-${classePrioridade}`);

    card.innerHTML = `

            <div class="solicitacao-main">

                <div class="solicitacao-titulo">

                    <span class="solicitacao-status">
                        Concluída
                    </span>

                    <h3>
                        ${tarefa.titulo}
                    </h3>

                </div>

                <p class="solicitacao-descricao">
                    ${tarefa.descricao || "Nenhuma descrição informada."}
                </p>

            </div>


            <div class="solicitacao-info">

                <div class="solicitacao-info-item">

                    <span>Prioridade</span>

                    <strong class="${classePrioridade}">
                        ${nomePrioridade}
                    </strong>

                </div>


                <div class="solicitacao-info-item">

                    <span>Solicitante</span>

                    <strong>
                        ${tarefa.solicitante}
                    </strong>

                </div>


                <div class="solicitacao-info-item">

                    <span>Responsável</span>

                    <strong>
                        ${tarefa.responsavel || "Não informado"}
                    </strong>

                </div>


                <div class="solicitacao-info-item">

                    <span>Data</span>

                    <strong>
                        ${tarefa.data}
                    </strong>

                </div>

            </div>


            <div class="solicitacao-arrow">
                →
            </div>

        `;

    lista.appendChild(card);
  });
}

function aplicarFiltros() {
  const busca = document
    .getElementById("busca-solicitacao")
    .value.toLowerCase()
    .trim();

  const prioridade = document.getElementById("filtro-prioridade").value;

  const dataBusca = document.getElementById("busca-data").value.trim();

  const tarefasFiltradas = tarefas.filter((tarefa) => {
    const correspondeBusca = tarefa.titulo.toLowerCase().includes(busca);

    const correspondePrioridade =
      prioridade === "all" || tarefa.prioridade === prioridade;

    const correspondeData = dataBusca === "" || tarefa.data.includes(dataBusca);

    return correspondeBusca && correspondePrioridade && correspondeData;
  });

  renderizarSolicitacoes(tarefasFiltradas);
}

const campoData = document.getElementById("busca-data");

campoData.addEventListener("input", () => {
  let valor = campoData.value.replace(/\D/g, "");

  if (valor.length > 2) {
    valor = valor.substring(0, 2) + "/" + valor.substring(2);
  }

  if (valor.length > 5) {
    valor = valor.substring(0, 5) + "/" + valor.substring(5, 9);
  }

  campoData.value = valor;

  aplicarFiltros();
});

document
  .getElementById("busca-solicitacao")
  .addEventListener("input", aplicarFiltros);

document
  .getElementById("filtro-prioridade")
  .addEventListener("change", aplicarFiltros);

document.getElementById("busca-data").addEventListener("input", aplicarFiltros);

carregarSolicitacoes();
