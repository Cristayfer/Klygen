from flask import Flask, render_template, request
from database import criar_banco, conectar

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/nova-tarefa")
def nova_tarefa():
    return render_template("nova-tarefa.html")

@app.route("/solicitacoes")
def solicitacoes():
    return render_template("solicitacoes.html")

@app.route("/api/solicitacoes")
def listar_solicitacoes():
    conexao = conectar()

    tarefas = conexao.execute("""
        SELECT *
        FROM tarefas
        WHERE status = 'completed'
        ORDER BY id DESC
    """).fetchall()

    conexao.close()

    return [dict(tarefa) for tarefa in tarefas]


@app.route("/api/tarefas", methods=["POST"])
def criar_tarefa():
    dados = request.get_json()

    print("TAREFA RECEBIDA:", dados)

    conexao = conectar()

    conexao.execute("""
        INSERT INTO tarefas (
            titulo,
            descricao,
            prioridade,
            estado,
            data,
            solicitante,
            responsavel,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        dados["titulo"],
        dados["descricao"],
        dados["prioridade"],
        dados["estado"],
        dados["data"],
        dados["solicitante"],
        "",
        "pending"
    ))

    conexao.commit()
    conexao.close()

    return {
        "sucesso": True,
        "mensagem": "Tarefa salva no banco de dados"
    }


@app.route("/api/tarefas", methods=["GET"])
def listar_tarefas():
    conexao = conectar()

    tarefas = conexao.execute("""
        SELECT *
        FROM tarefas
        ORDER BY id DESC
    """).fetchall()

    conexao.close()

    return {
        "tarefas": [dict(tarefa) for tarefa in tarefas]
    }

@app.route("/api/tarefas/<int:tarefa_id>/status", methods=["PUT"])
def atualizar_status(tarefa_id):
    dados = request.get_json()

    novo_status = dados.get("status")
    responsavel = dados.get("responsavel", "")

    conexao = conectar()

    conexao.execute("""
        UPDATE tarefas
        SET status = ?, responsavel = ?
        WHERE id = ?
    """, (
        novo_status,
        responsavel,
        tarefa_id
    ))

    conexao.commit()
    conexao.close()

    return {
        "sucesso": True,
        "mensagem": "Status atualizado"
    }



if __name__ == "__main__":
    criar_banco()
    app.run(debug=True)