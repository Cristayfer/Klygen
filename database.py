import sqlite3

DATABASE = "klygen.db"


def conectar():
    conexao = sqlite3.connect(DATABASE)
    conexao.row_factory = sqlite3.Row
    return conexao


def criar_banco():
    conexao = conectar()

    conexao.execute("""
        CREATE TABLE IF NOT EXISTS tarefas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            descricao TEXT,
            prioridade TEXT NOT NULL,
            data TEXT NOT NULL,
            solicitante TEXT NOT NULL,
            responsavel TEXT,
            status TEXT NOT NULL DEFAULT 'pending'
        )
    """)

    conexao.commit()
    conexao.close()