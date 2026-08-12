import os
from flask import Flask, render_template, request, session, redirect, url_for
from functools import wraps
from database import criar_banco, conectar, criar_usuario
from werkzeug.security import check_password_hash
from werkzeug.utils import secure_filename



app = Flask(__name__)
app.secret_key = "klygen-chave-secreta"

PASTA_PERFIS = os.path.join(
app.static_folder,
"img",
"perfis"
)

os.makedirs(PASTA_PERFIS, exist_ok=True)

def login_required(func):

    @wraps(func)
    def verificar_login(*args, **kwargs):

        if "usuario_id" not in session:
            return redirect(url_for("login"))

        return func(*args, **kwargs)

    return verificar_login

@app.route("/logout")
def logout():

    session.clear()

    return redirect(url_for("login"))

@app.route("/api/usuario-logado")
@login_required
def usuario_logado():

    conexao = conectar()

    usuario = conexao.execute("""
        SELECT
            id,
            nome,
            usuario,
            ramal,
            foto,
            pode_criar,
            pode_resolver,
            administrador,
            ativo
        FROM usuarios
        WHERE id = ?
    """, (session["usuario_id"],)).fetchone()

    conexao.close()

    if not usuario:
        return {
            "mensagem": "Usuário não encontrado."
        }, 404

    return {
        "usuario": dict(usuario)
    }

@app.route("/api/usuario-logado/foto", methods=["POST"])
@login_required
def atualizar_foto_perfil():

    if "foto" not in request.files:
        return {
            "mensagem": "Nenhuma foto foi enviada."
        }, 400

    arquivo = request.files["foto"]

    if arquivo.filename == "":
        return {
            "mensagem": "Nenhuma foto selecionada."
        }, 400

    extensoes_permitidas = {
        "png",
        "jpg",
        "jpeg",
        "webp"
    }

    nome_original = secure_filename(arquivo.filename)

    if "." not in nome_original:
        return {
            "mensagem": "Formato de imagem inválido."
        }, 400

    extensao = nome_original.rsplit(".", 1)[1].lower()

    if extensao not in extensoes_permitidas:
        return {
            "mensagem": "Formato não permitido."
        }, 400

    nome_arquivo = f"usuario_{session['usuario_id']}.{extensao}"

    caminho = os.path.join(
        PASTA_PERFIS,
        nome_arquivo
    )

    arquivo.save(caminho)

    caminho_banco = f"/static/img/perfis/{nome_arquivo}"

    conexao = conectar()

    conexao.execute("""
        UPDATE usuarios
        SET foto = ?
        WHERE id = ?
    """, (
        caminho_banco,
        session["usuario_id"]
    ))

    conexao.commit()
    conexao.close()

    return {
        "sucesso": True,
        "foto": caminho_banco
}


@app.route("/")
@login_required
def index():
    return render_template("index.html")

@app.route("/login")
def login():
    return render_template("login.html")

@app.route("/nova-tarefa")
@login_required
def nova_tarefa():
    return render_template("nova-tarefa.html")

@app.route("/meu-perfil")
@login_required
def meu_perfil():
    return render_template("meu-perfil.html")

@app.route("/solicitacoes")
@login_required
def solicitacoes():
    return render_template("solicitacoes.html")

@app.route("/equipe")
def equipe():
    return render_template("equipe.html")

@app.route("/cadastro")
def cadastro():
    return render_template("cadastro.html")

@app.route("/api/login", methods=["POST"])
def realizar_login():

    dados = request.get_json()

    usuario = dados.get("usuario", "").strip()
    senha = dados.get("senha", "")

    if not usuario or not senha:
        return {
            "mensagem": "Informe usuário e senha."
        }, 400

    conexao = conectar()

    usuario_banco = conexao.execute("""
        SELECT *
        FROM usuarios
        WHERE usuario = ?
    """, (usuario,)).fetchone()

    conexao.close()

    if not usuario_banco:
        return {
            "mensagem": "Usuário ou senha incorretos."
        }, 401

    if not usuario_banco["ativo"]:
        return {
            "mensagem": "Esta conta está inativa."
        }, 403

    if not check_password_hash(usuario_banco["senha"], senha):
        return {
            "mensagem": "Usuário ou senha incorretos."
        }, 401

    session["usuario_id"] = usuario_banco["id"]
    session["nome"] = usuario_banco["nome"]
    session["usuario"] = usuario_banco["usuario"]
    session["pode_criar"] = bool(usuario_banco["pode_criar"])
    session["pode_resolver"] = bool(usuario_banco["pode_resolver"])
    session["administrador"] = bool(usuario_banco["administrador"])

    return {
        "sucesso": True,
        "mensagem": "Login realizado com sucesso."
    }

@app.route("/api/usuarios")
def listar_usuarios():
    conexao = conectar()


    usuarios = conexao.execute("""
        SELECT
            id,
            nome,
            usuario,
            ramal,
            foto,
            pode_criar,
            pode_resolver,
            administrador,
            ativo
        FROM usuarios
        ORDER BY nome ASC
    """).fetchall()

    conexao.close()

    return{
        "usuarios": [dict(usuario) for usuario in usuarios]
    }

@app.route("/api/cadastro", methods=["POST"])
def cadastrar_usuario():

    dados = request.get_json()

    nome = dados.get("nome", "").strip()
    usuario = dados.get("usuario", "").strip()
    senha = dados.get("senha", "")

    if not nome or not usuario or not senha:
        return {
            "mensagem": "Preencha todos os campos."
        }, 400

    conexao = conectar()

    usuario_existente = conexao.execute("""
        SELECT id
        FROM usuarios
        WHERE usuario = ?
    """, (usuario,)).fetchone()

    conexao.close()

    if usuario_existente:
        return {
            "mensagem": "Esse usuário já existe."
        }, 409

    try:

        conexao = conectar()

        quantidade_usuarios = conexao.execute("""
            SELECT COUNT(*) AS total
            FROM usuarios
        """).fetchone()["total"]

        conexao.close()

        primeiro_usuario = quantidade_usuarios == 0

        criar_usuario(
            nome,
            usuario,
            senha,
            administrador=primeiro_usuario
        )

        if primeiro_usuario:
            mensagem = "Conta criada com sucesso. Você é o administrador."
        else:
            mensagem = "Conta criada com sucesso."

        return {
            "sucesso": True,
            "mensagem": mensagem
        }

    except Exception as erro:

        print("ERRO AO CADASTRAR USUÁRIO:", erro)

        return {
            "mensagem": "Não foi possível criar a conta."
        }, 500

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