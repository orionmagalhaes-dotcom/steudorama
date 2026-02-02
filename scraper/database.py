"""
Módulo de gerenciamento do banco de dados SQLite para o EuDorama.
Armazena informações de episódios e séries obtidos do scraper.
"""

import sqlite3
import os
from datetime import datetime
from typing import Optional, List, Dict, Any

DATABASE_PATH = os.path.join(os.path.dirname(__file__), 'eudorama.db')


class Database:
    """Gerenciador do banco de dados SQLite para o EuDorama."""

    def __init__(self, db_path: str = DATABASE_PATH):
        self.db_path = db_path
        self._create_tables()

    def _get_connection(self) -> sqlite3.Connection:
        """Cria uma conexão com o banco de dados."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _create_tables(self):
        """Cria as tabelas necessárias se não existirem."""
        conn = self._get_connection()
        cursor = conn.cursor()

        # Tabela de séries
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS series (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tmdb_id INTEGER UNIQUE,
                title TEXT NOT NULL,
                original_title TEXT,
                kissasian_url TEXT,
                origin_country TEXT,
                poster_path TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Tabela de episódios
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS episodes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                series_id INTEGER NOT NULL,
                tmdb_id INTEGER,
                episode_number INTEGER NOT NULL,
                season_number INTEGER DEFAULT 1,
                title TEXT,
                source_url TEXT NOT NULL,
                video_url TEXT,
                quality TEXT DEFAULT 'auto',
                added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (series_id) REFERENCES series(id),
                UNIQUE(series_id, season_number, episode_number)
            )
        ''')

        # Índices para melhor performance
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_series_tmdb ON series(tmdb_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_episodes_series ON episodes(series_id)')

        conn.commit()
        conn.close()

    def add_series(
        self,
        title: str,
        tmdb_id: Optional[int] = None,
        original_title: Optional[str] = None,
        kissasian_url: Optional[str] = None,
        origin_country: Optional[str] = None,
        poster_path: Optional[str] = None
    ) -> int:
        """
        Adiciona uma nova série ao banco de dados.
        
        Returns:
            ID da série inserida
        """
        conn = self._get_connection()
        cursor = conn.cursor()

        try:
            cursor.execute('''
                INSERT INTO series (tmdb_id, title, original_title, kissasian_url, origin_country, poster_path)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (tmdb_id, title, original_title, kissasian_url, origin_country, poster_path))
            conn.commit()
            return cursor.lastrowid
        except sqlite3.IntegrityError:
            # Série já existe, retorna o ID existente
            cursor.execute('SELECT id FROM series WHERE tmdb_id = ?', (tmdb_id,))
            row = cursor.fetchone()
            return row['id'] if row else -1
        finally:
            conn.close()

    def add_episode(
        self,
        series_id: int,
        episode_number: int,
        source_url: str,
        tmdb_id: Optional[int] = None,
        season_number: int = 1,
        title: Optional[str] = None,
        video_url: Optional[str] = None,
        quality: str = 'auto'
    ) -> int:
        """
        Adiciona um novo episódio ao banco de dados.
        
        Returns:
            ID do episódio inserido ou -1 se já existir
        """
        conn = self._get_connection()
        cursor = conn.cursor()

        try:
            cursor.execute('''
                INSERT INTO episodes (series_id, tmdb_id, episode_number, season_number, title, source_url, video_url, quality)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (series_id, tmdb_id, episode_number, season_number, title, source_url, video_url, quality))
            conn.commit()
            return cursor.lastrowid
        except sqlite3.IntegrityError:
            # Episódio já existe
            return -1
        finally:
            conn.close()

    def get_series_by_tmdb_id(self, tmdb_id: int) -> Optional[Dict[str, Any]]:
        """Busca uma série pelo ID do TMDB."""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM series WHERE tmdb_id = ?', (tmdb_id,))
        row = cursor.fetchone()
        conn.close()
        
        return dict(row) if row else None

    def get_series_by_url(self, kissasian_url: str) -> Optional[Dict[str, Any]]:
        """Busca uma série pela URL do KissAsian."""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM series WHERE kissasian_url = ?', (kissasian_url,))
        row = cursor.fetchone()
        conn.close()
        
        return dict(row) if row else None

    def get_episodes_by_series(self, series_id: int) -> List[Dict[str, Any]]:
        """Retorna todos os episódios de uma série."""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM episodes 
            WHERE series_id = ? 
            ORDER BY season_number, episode_number
        ''', (series_id,))
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]

    def episode_exists(self, series_id: int, season_number: int, episode_number: int) -> bool:
        """Verifica se um episódio já existe no banco."""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT 1 FROM episodes 
            WHERE series_id = ? AND season_number = ? AND episode_number = ?
        ''', (series_id, season_number, episode_number))
        exists = cursor.fetchone() is not None
        conn.close()
        
        return exists

    def get_latest_episode(self, series_id: int) -> Optional[Dict[str, Any]]:
        """Retorna o último episódio de uma série."""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM episodes 
            WHERE series_id = ? 
            ORDER BY season_number DESC, episode_number DESC 
            LIMIT 1
        ''', (series_id,))
        row = cursor.fetchone()
        conn.close()
        
        return dict(row) if row else None

    def get_all_series(self) -> List[Dict[str, Any]]:
        """Retorna todas as séries cadastradas."""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM series ORDER BY updated_at DESC')
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]

    def update_series_timestamp(self, series_id: int):
        """Atualiza o timestamp de updated_at de uma série."""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE series SET updated_at = ? WHERE id = ?
        ''', (datetime.now().isoformat(), series_id))
        conn.commit()
        conn.close()

    def get_stats(self) -> Dict[str, int]:
        """Retorna estatísticas do banco de dados."""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT COUNT(*) as count FROM series')
        series_count = cursor.fetchone()['count']
        
        cursor.execute('SELECT COUNT(*) as count FROM episodes')
        episodes_count = cursor.fetchone()['count']
        
        conn.close()
        
        return {
            'total_series': series_count,
            'total_episodes': episodes_count
        }


# Teste rápido
if __name__ == '__main__':
    db = Database()
    print("✓ Banco de dados inicializado com sucesso!")
    print(f"  Localização: {DATABASE_PATH}")
    stats = db.get_stats()
    print(f"  Séries: {stats['total_series']}")
    print(f"  Episódios: {stats['total_episodes']}")
