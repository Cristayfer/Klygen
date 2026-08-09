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

  campoData.value = `${ano}-${mes}${dia}`;

  const fechar = document.getElementById("cancelar");
  fechar.addEventListener("click", () => {
    modalContainer.innerHTML = "";
  });

  const formulario = document.getElementById("task-form");
  formulario.addEventListener("submit", (event) => {
    event.preventDefault();

    const titulo = document.getElementById("titulo").value;
    const prioridade = document.getElementById("prioridade").value;
    const data = document.getElementById("data").value;
    const solicitante = document.getElementById("solicitante").value;

    criarTarefa(titulo, prioridade, data, solicitante);

    modalContainer.innerHTML = "";
  });
});

function criarTarefa(titulo, prioridade, data, solicitante) {
  const taskList = document.querySelector(".column .task-list");

  const card = document.createElement("div");
  card.classList.add("card", `priority-${prioridade}`);

  let nomePrioridade = "";

  if (prioridade === "high") {
    nomePrioridade = "Alta";
  } else if (prioridade === "medium") {
    nomePrioridade = "Média";
  } else {
    nomePrioridade = "Baixa";
  }

  const dataFormatada = formatarData(data);

  card.innerHTML = `
        <span class="badge priority-${prioridade}">
            ${nomePrioridade}
        </span>
        
        <h4>${titulo}</h4>
        
        <div class="card-footer">
            <span class="card-date>
                📅 ${dataFormatada}
            </span>
            
            <div class="avatar">
                ${solicitante}
            </div>
        </div>
    `;

  taskList.appendChild(card);
}

function formatarData(data) {
  const partes = data.split("-");

  const dia = partes[2];
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

  return `${data} ${meses[mes]}`;
}
