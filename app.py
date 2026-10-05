import os
from flask import Flask, render_template, request, session, redirect, url_for, send_from_directory
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
PASTA_ANEXOS = os.path.join(
    app.static_folder,
    "uploads",
    "tarefas"
)

os.makedirs(PASTA_PERFIS, exist_ok=True)
os.makedirs(PASTA_ANEXOS, exist_ok=True)

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

@app.route("/api/usuario-logado", methods=["GET", "PUT"])
@login_required
def usuario_logado():

    conexao = conectar()

    if request.method == "PUT":

        dados = request.get_json()

        nome = dados.get("nome")
        ramal = dados.get("ramal")

        if nome is not None:
            nome = nome.strip()

            if not nome:
                conexao.close()

                return {
                    "sucesso": False,
                    "mensagem": "O nome não pode ficar vazio."
                }, 400

            conexao.execute("""
                UPDATE usuarios
                SET nome = ?
                WHERE id = ?
            """, (
                nome,
                session["usuario_id"]
            ))

        if ramal is not None:

            ramal = ramal.strip()

            conexao.execute("""
                UPDATE usuarios
                SET ramal = ?
                WHERE id = ?
            """, (
                ramal,
                session["usuario_id"]
            ))

        conexao.commit()
        conexao.close()

        return {
            "sucesso": True,
            "mensagem": "Dados atualizados com sucesso."
        }

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

@app.route("/api/usuario-logado", methods=["PUT"])
@login_required
def atualizar_usuario_logado():

    dados = request.get_json()

    nome = dados.get("nome", "").strip()
    ramal = dados.get("ramal", "").strip()

    if not nome:
        return {
            "sucesso": False,
            "mensagem": "O nome não pode ficar vazio."
        }, 400

    conexao = conectar()

    conexao.execute("""
        UPDATE usuarios
        SET nome = ?, ramal = ?
        WHERE id = ?
    """, (
        nome,
        ramal,
        session["usuario_id"]
    ))

    conexao.commit()
    conexao.close()

    return {
        "sucesso": True,
        "mensagem": "Dados atualizados com sucesso.",
        "nome": nome,
        "ramal": ramal
    }


@app.route("/api/anexos/<int:anexo_id>/download")
def baixar_anexo(anexo_id):

    conexao = conectar()

    anexo = conexao.execute("""
        SELECT nome_arquivo, nome_original
        FROM anexos
        WHERE id = ?
    """, (
        anexo_id,
    )).fetchone()

    conexao.close()

    if not anexo:
        return {
            "sucesso": False,
            "mensagem": "Arquivo não encontrado."
        }, 404

    return send_from_directory(
        PASTA_ANEXOS,
        anexo["nome_arquivo"],
        as_attachment=True,
        download_name=anexo["nome_original"]
    )


@app.route("/api/usuarios/<usuario>")
@login_required
def buscar_usuario(usuario):

    conexao = conectar()

    usuario_banco = conexao.execute("""
        SELECT
            id,
            nome,
            usuario,
            foto,
            ramal,
            pode_criar,
            pode_resolver,
            administrador,
            ativo
        FROM usuarios
        WHERE usuario = ?
    """, (usuario,)).fetchone()

    conexao.close()

    if not usuario_banco:
        return {
            "mensagem": "Usuário não encontrado."
        }, 404

    return {
        "usuario": dict(usuario_banco)
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
    return render_template("perfil.html")

@app.route("/solicitacoes")
@login_required
def solicitacoes():
    return render_template("solicitacoes.html")

@app.route("/equipe")
@login_required
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


@app.route("/api/usuario/foto", methods=["POST"])
def salvar_foto_perfil():

    if "usuario_id" not in session:
        return {
            "sucesso": False,
            "mensagem": "Usuário não autenticado."
        }, 401

    if "foto" not in request.files:
        return {
            "sucesso": False,
            "mensagem": "Nenhuma foto foi enviada."
        }, 400

    foto = request.files["foto"]

    if foto.filename == "":
        return {
            "sucesso": False,
            "mensagem": "Nenhuma foto selecionada."
        }, 400

    extensoes_permitidas = {"png", "jpg", "jpeg", "webp"}

    nome_original = secure_filename(foto.filename)
    extensao = nome_original.rsplit(".", 1)[-1].lower()

    if extensao not in extensoes_permitidas:
        return {
            "sucesso": False,
            "mensagem": "Formato de imagem não permitido."
        }, 400

    nome_arquivo = f"usuario_{session['usuario_id']}.{extensao}"

    pasta_perfis = os.path.join(
        app.static_folder,
        "img",
        "perfis"
    )

    os.makedirs(pasta_perfis, exist_ok=True)

    caminho_arquivo = os.path.join(
        pasta_perfis,
        nome_arquivo
    )

    foto.save(caminho_arquivo)

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
        "mensagem": "Foto atualizada com sucesso.",
        "foto": caminho_banco
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

    titulo = request.form.get("titulo", "").strip()
    descricao = request.form.get("descricao", "").strip()
    prioridade = request.form.get("prioridade", "")
    estado = request.form.get("estado", "")
    data = request.form.get("data", "")
    solicitante = request.form.get("solicitante", "").strip()

    if not titulo or not prioridade or not estado or not data or not solicitante:
        return {
            "sucesso": False,
            "mensagem": "Preencha todos os campos obrigatórios."
        }, 400

    conexao = conectar()

    # ============================================================
    # LIMITE DE 5 TAREFAS ABERTAS POR USUÁRIO
    # ============================================================

    tarefas_abertas = conexao.execute("""
        SELECT COUNT(*) AS total
        FROM tarefas
        WHERE solicitante = ?
        AND status != 'completed'
    """, (solicitante,)).fetchone()

    total_tarefas = tarefas_abertas["total"]

    if total_tarefas >= 5:
        conexao.close()

        return {
            "sucesso": False,
            "mensagem": (
                "Você já possui 5 solicitações em aberto. "
                "Assim que uma solicitação for concluída poderá abrir outra"
            )
        }, 400


    cursor = conexao.execute("""
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
        titulo,
        descricao,
        prioridade,
        estado,
        data,
        solicitante,
        "",
        "pending"
    ))

    tarefa_id = cursor.lastrowid

    arquivos = request.files.getlist("anexo")

    for arquivo in arquivos:

        if not arquivo or arquivo.filename == "":
            continue

        nome_original = arquivo.filename

        nome_seguro = secure_filename(nome_original)

        if not nome_seguro:
            continue

        nome_arquivo = f"tarefa_{tarefa_id}_{nome_seguro}"

        caminho = os.path.join(
            PASTA_ANEXOS,
            nome_arquivo
        )

        arquivo.save(caminho)

        caminho_banco = f"/static/uploads/tarefas/{nome_arquivo}"

        conexao.execute("""
            INSERT INTO anexos (
                tarefa_id,
                nome_original,
                nome_arquivo,
                caminho
            )
            VALUES (?, ?, ?, ?)
        """, (
            tarefa_id,
            nome_original,
            nome_arquivo,
            caminho_banco
        ))

    conexao.commit()
    conexao.close()

    print(
        f"TAREFA {tarefa_id} CRIADA COM {len(arquivos)} ANEXO(S)"
    )

    return {
        "sucesso": True,
        "mensagem": "Tarefa salva no banco de dados",
        "id": tarefa_id,
        "tarefa_id": tarefa_id
    }

@app.route("/api/tarefas", methods=["GET"])
def listar_tarefas():

    conexao = conectar()

    tarefas = conexao.execute("""
        SELECT *
        FROM tarefas
        ORDER BY id DESC
    """).fetchall()

    lista_tarefas = []

    for tarefa in tarefas:

        tarefa_dict = dict(tarefa)

        anexos = conexao.execute("""
            SELECT
                id,
                nome_original,
                nome_arquivo,
                caminho
            FROM anexos
            WHERE tarefa_id = ?
            ORDER BY id ASC
        """, (
            tarefa["id"],
        )).fetchall()

        tarefa_dict["anexos"] = []

        for anexo in anexos:

            tarefa_dict["anexos"].append({
                "id": anexo["id"],
                "name": anexo["nome_original"],
                "url": anexo["caminho"],
                "download_url": f"/api/anexos/{anexo['id']}/download"
            })

        lista_tarefas.append(tarefa_dict)

    conexao.close()

    return {
        "tarefas": lista_tarefas
    }


@app.route("/api/tarefas/<int:tarefa_id>/status", methods=["PUT"])
@login_required
def atualizar_status(tarefa_id):
    dados = request.get_json()

    novo_status = dados.get("status")
    responsavel = dados.get("responsavel", "")

    conexao = conectar()
    usuario = conexao.execute("""
        SELECT
            id,
            usuario,
            pode_resolver,
            administrador
        FROM usuarios
        WHERE id = ?
    """, (session["usuario_id"],)).fetchone()

    if not usuario:
        conexao.close()

        return {
            "sucesso": False,
            "mensagem": "Usuário não encontrado."
        }, 404

    tarefa = conexao.execute("""
        SELECT
            id,
            status,
            solicitante,
            responsavel
        FROM tarefas
        WHERE id = ?
    """, (tarefa_id,)).fetchone()

    if not tarefa:
        conexao.close()

        return {
            "sucesso": False,
            "mensagem": "Tarefa não encontrada."
        }, 404

    pode_resolver = (
        usuario["pode_resolver"] or
        usuario["administrador"]
    )

    eh_solicitante = (
        tarefa["solicitante"] == usuario["usuario"]
    )

    status_atual = tarefa["status"]

    if pode_resolver:


        if status_atual == "pending" and novo_status == "progress":
            pass


        elif status_atual == "progress" and novo_status == "ready":
            pass

        elif status_atual == "review" and novo_status == "progress":
            pass

        else:
            conexao.close()

            return {
                "sucesso": False,
                "mensagem": "Essa alteração de status não é permitida."
            }, 403

    elif eh_solicitante:

  
        if status_atual == "ready" and novo_status == "completed":
            pass


        elif status_atual == "ready" and novo_status == "review":
            pass

        else:
            conexao.close()

            return {
                "sucesso": False,
                "mensagem": "Você não tem permissão para executar esta ação."
            }, 403

    else:
        conexao.close()

        return {
            "sucesso": False,
            "mensagem": "Você não tem permissão para alterar esta tarefa."
        }, 403


    if not pode_resolver:
        responsavel = tarefa["responsavel"] or ""


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


@app.route("/api/usuario-logado/foto", methods=["DELETE"])
@login_required
def remover_foto_perfil():

    conexao = conectar()

    conexao.execute("""
        UPDATE usuarios
        SET foto = NULL
        WHERE id = ?
    """, (session["usuario_id"],))

    conexao.commit()
    conexao.close()

    return {
        "sucesso": True,
        "mensagem": "Foto removida com sucesso."
    }


if __name__ == "__main__":
    criar_banco()
    app.run(port=5000, 
            debug=True)