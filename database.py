import sqlite3
from werkzeug.security import generate_password_hash

DATABASE = "klygen.db"


def conectar():
    conexao = sqlite3.connect(DATABASE)
    conexao.row_factory = sqlite3.Row
    return conexao

def criar_usuario(nome, usuario, senha, administrador=False):
    conexao = conectar()

    senha_hash = generate_password_hash(senha)

    conexao.execute("""
        INSERT INTO usuarios (
            nome,
            usuario,
            senha,
            ramal,
            foto,
            pode_criar,
            pode_resolver,
            administrador,
            ativo
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        nome,
        usuario,
        senha_hash,
        None,
        None,
        1,
        1 if administrador else 0,
        1 if administrador else 0,
        1
    ))

    conexao.commit()
    conexao.close()

def criar_banco():
    conexao = conectar()

    conexao.execute("""
        CREATE TABLE IF NOT EXISTS tarefas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            descricao TEXT,
            prioridade TEXT NOT NULL,
            estado TEXT NOT NULL,
            data TEXT NOT NULL,
            solicitante TEXT NOT NULL,
            responsavel TEXT,
            status TEXT NOT NULL DEFAULT 'pending'
        )
    """)

    conexao.execute("""
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            usuario TEXT NOT NULL UNIQUE,
            senha TEXT NOT NULL,
            pode_criar INTEGER NOT NULL DEFAULT 1,
            pode_resolver INTEGER NOT NULL DEFAULT 0,
            administrador INTEGER NOT NULL DEFAULT 0,
            ativo INTEGER NOT NULL DEFAULT 1
        )
    """)

    colunas = conexao.execute("PRAGMA table_info(usuarios)").fetchall()
    nomes_colunas = [coluna ["name"] for coluna in colunas]
    if "ramal" not in nomes_colunas:
        conexao.execute("ALTER TABLE usuarios ADD COLUMN ramal TEXT")

    if "foto" not in nomes_colunas:
        conexao.execute("ALTER TABLE usuarios ADD COLUMN foto TEXT")



    conexao.commit()
    conexao.close()