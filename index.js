const abrir = document.getElementById("abrir");
const modalContainer = document.getElementById("modal-container");

abrir.addEventListener("click", async () => {
  const resposta = await fetch("nova-tarefa.html");
  const html = await resposta.text();

  modalContainer.innerHTML = html;

  const campoData = document.getElementById("data");

  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");

  campoData.value = `${dia}/${mes}/${ano}`;

  const fechar = document.getElementById("cancelar");
  fechar.addEventListener("click", () => {
    modalContainer.innerHTML = "";
  });

  const formulario = document.getElementById("task-form");
  formulario.addEventListener("submit", (event) => {
    event.preventDefault();

    const titulo = document.getElementById("titulo").value;
    const descricao = document.getElementById("descricao").value;
    const prioridade = document.getElementById("prioridade").value;
    const data = document.getElementById("data").value;
    const solicitante = document.getElementById("solicitante").value;
    const arquivos = Array.from(document.getElementById("anexo").files);
    criarTarefa(titulo, descricao, prioridade, data, solicitante, arquivos);

    modalContainer.innerHTML = "";
  });
});

function criarTarefa(
  titulo,
  descricao,
  prioridade,
  data,
  solicitante,
  arquivos,
) {
  const taskList = document.querySelector(".column .task-list");

  const card = document.createElement("div");
  card.classList.add("card", `priority-${prioridade}`);

  card.dataset.status = "pending";
  card.dataset.responsavel = "";

  card.addEventListener("click", () => {
    abrirDetalhes(
      card,
      titulo,
      descricao,
      prioridade,
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

  card.dataset.titulo = titulo;
  card.dataset.descricao = descricao;
  card.dataset.prioridade = prioridade;
  card.dataset.data = data;
  card.dataset.solicitante = solicitante;

  card.innerHTML = `
        <span class="badge priority-${prioridade}">
            ${nomePrioridade}
        </span>
        
        <h4>${titulo}</h4>
        
        <div class="card-footer">
            <span class="card-date">
                📅 ${dataFormatada}
            </span>
            
            <div class="avatar">
                ${solicitante}
            </div>
        </div>
    `;

  taskList.appendChild(card);
  atualizarContadores();
}

function abrirDetalhes(
  card,
  titulo,
  descricao,
  prioridade,
  data,
  solicitante,
  arquivos,
) {
  const detailsContainer = document.getElementById("details-modal-container");

  detailsContainer.style.display = "flex";
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

  const responsavel = card.dataset.responsavel || "Ainda não atribuído";

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

  detailsContainer.innerHTML = `
    <div class="details-modal">

      <div class="details-header">

        <div>
          <span class="details-label">SOLICITAÇÃO</span>
          <h2>${titulo}</h2>
        </div>

        <button id="fechar-detalhes">&times;</button>

      </div>

      <div class="details-body">

        <div class="details-section">
          <h3>Descrição</h3>

          <div class="description">${descricao || "Nenhuma descrição informada."}</div>
        </div>

        <div class="details-section">
          <h3>Anexos</h3>

          <div class="attachments">
            ${listaArquivos}
          </div>
        </div>

        <div class="details-info">

          <div class="info-item">
            <span>Prioridade</span>
            <strong>${nomePrioridade}</strong>
          </div>

          <div class="info-item">
            <span>Data de Solicitação</span>
            <strong>${data}</strong>
          </div>

          <div class="info-item">
            <span>Solicitante</span>
            <strong>${solicitante}</strong>
          </div>

          <div class="info-item">
            <span>Responsável</span>
            <strong>${responsavel}</strong>
          </div>

          <div class="info-item">
            <span>Status</span>
            <strong>${nomeStatus}</strong>
          </div>

        </div>

        <div class="details-actions">

          ${
            card.dataset.status === "pending"
              ? `
                <button id="assumir-tarefa" class="btn-assume">
                  Assumir Tarefa
                </button>
              `
              : ""
          }

          ${
            card.dataset.status === "progress"
              ? `
              <button id="finalizar-tarefa" class="btn-assume">
                Finalizar Tarefa
              </button>
              `
              : ""
          }

          ${
            card.dataset.status === "ready"
              ? `
              <button id="concluir-tarefa" class="btn-assume">
                Marcar como Concluída
              </button>

              <button id="revisar-tarefa" class="btn-review">
                Não foi resolvido
              </button>
              `
              : ""
          }
          ${
            card.dataset.status === "review"
              ? `
              <button id="retomar-tarefa" class="btn-assume">
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

  fechar.addEventListener("click", () => {
    detailsContainer.innerHTML = "";
    detailsContainer.style.display = "none";
  });

  const assumir = document.getElementById("assumir-tarefa");

  if (assumir) {
    assumir.addEventListener("click", () => {
      const usuarioAtual = "CA";

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

      atualizarContadores();

      detailsContainer.innerHTML = "";
      detailsContainer.style.display = "none";
    });
  }
  const finalizar = document.getElementById("finalizar-tarefa");

  if (finalizar) {
    finalizar.addEventListener("click", () => {
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

      atualizarContadores();

      detailsContainer.innerHTML = "";
      detailsContainer.style.display = "none";
    });
  }
  const concluir = document.getElementById("concluir-tarefa");

  if (concluir) {
    concluir.addEventListener("click", () => {
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

      atualizarContadores();

      detailsContainer.innerHTML = "";
      detailsContainer.style.display = "none";
    });
  }

  const revisar = document.getElementById("revisar-tarefa");

  if (revisar) {
    revisar.addEventListener("click", () => {
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

      atualizarContadores();

      detailsContainer.innerHTML = "";
      detailsContainer.style.display = "none";
    });
  }
  const retomar = document.getElementById("retomar-tarefa");

  if (retomar) {
    retomar.addEventListener("click", () => {
      const colunaAndamento = document.querySelector(
        '.column[data-status="progress"] .task-list',
      );

      if (!colunaAndamento) {
        console.error("Coluna Em andamento não encontrada.");
        return;
      }

      card.dataset.status = "progress";

      colunaAndamento.appendChild(card);

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

    contador.textContent = tarefas.length;
  });
}

function formatarData(data) {
  const partes = data.split("/");

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

  return `${dia} ${meses[mes]}`;
}
