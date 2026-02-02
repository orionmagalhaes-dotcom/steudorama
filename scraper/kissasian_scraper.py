"""
Scraper do KissAsian usando Playwright.
Monitora o site em busca de novos episódios de doramas.
"""

import asyncio
import re
import os
from datetime import datetime
from typing import List, Dict, Optional, Any
from urllib.parse import urljoin

import requests
from playwright.async_api import async_playwright, Browser, Page, TimeoutError as PlaywrightTimeout
from dotenv import load_dotenv

from database import Database

# Carrega variáveis de ambiente
load_dotenv()

# Configurações
KISSASIAN_BASE_URL = "https://kissasian.cam"
TMDB_API_KEY = os.getenv('TMDB_API_KEY', '')
TMDB_BASE_URL = "https://api.themoviedb.org/3"

# User agent para simular um navegador real
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"


class KissAsianScraper:
    """Scraper para o site KissAsian usando Playwright."""

    def __init__(self):
        self.db = Database()
        self.browser: Optional[Browser] = None

    async def init_browser(self):
        """Inicializa o navegador Playwright."""
        playwright = await async_playwright().start()
        self.browser = await playwright.chromium.launch(
            headless=True,
            args=['--disable-blink-features=AutomationControlled']
        )
        print("✓ Navegador inicializado")

    async def close_browser(self):
        """Fecha o navegador."""
        if self.browser:
            await self.browser.close()
            print("✓ Navegador fechado")

    async def _get_page(self) -> Page:
        """Cria uma nova página com configurações anti-detecção."""
        context = await self.browser.new_context(
            user_agent=USER_AGENT,
            viewport={'width': 1920, 'height': 1080},
            locale='pt-BR'
        )
        page = await context.new_page()
        
        # Bloqueia recursos desnecessários para acelerar
        await page.route("**/*.{png,jpg,jpeg,gif,webp}", lambda route: route.abort())
        await page.route("**/ads/**", lambda route: route.abort())
        await page.route("**/analytics/**", lambda route: route.abort())
        
        return page

    async def scrape_latest_updates(self) -> List[Dict[str, Any]]:
        """
        Scrape a página inicial para obter as últimas atualizações.
        
        Returns:
            Lista de dicionários com informações das séries atualizadas
        """
        updates = []
        page = await self._get_page()

        try:
            print(f"[Scraper] Acessando {KISSASIAN_BASE_URL}...")
            await page.goto(KISSASIAN_BASE_URL, wait_until='domcontentloaded', timeout=30000)
            await page.wait_for_timeout(2000)  # Espera carregamento dinâmico

            # Busca os cards de doramas recentes
            drama_cards = await page.query_selector_all('.item-drama, .drama-item, .list-item')
            
            print(f"[Scraper] Encontrados {len(drama_cards)} itens")

            for card in drama_cards[:20]:  # Limita a 20 itens
                try:
                    # Extrai informações do card
                    title_elem = await card.query_selector('a.title, h3 a, .drama-title a')
                    link_elem = await card.query_selector('a')
                    episode_elem = await card.query_selector('.episode, .ep-number, .latest-ep')

                    if title_elem and link_elem:
                        title = await title_elem.inner_text()
                        link = await link_elem.get_attribute('href')
                        
                        episode_text = ""
                        if episode_elem:
                            episode_text = await episode_elem.inner_text()

                        # Parse do número do episódio
                        episode_match = re.search(r'(?:ep(?:isode)?|cap(?:ítulo)?)\s*(\d+)', episode_text, re.IGNORECASE)
                        episode_number = int(episode_match.group(1)) if episode_match else None

                        updates.append({
                            'title': title.strip(),
                            'url': urljoin(KISSASIAN_BASE_URL, link),
                            'latest_episode': episode_number,
                            'episode_text': episode_text.strip()
                        })

                except Exception as e:
                    print(f"[Scraper] Erro ao processar card: {e}")
                    continue

        except PlaywrightTimeout:
            print("[Scraper] Timeout ao acessar o site")
        except Exception as e:
            print(f"[Scraper] Erro: {e}")
        finally:
            await page.close()

        return updates

    async def scrape_series_page(self, series_url: str) -> Dict[str, Any]:
        """
        Scrape a página de uma série específica para obter episódios.
        
        Args:
            series_url: URL da página da série
            
        Returns:
            Dicionário com informações da série e lista de episódios
        """
        series_info = {
            'title': '',
            'original_title': '',
            'description': '',
            'episodes': []
        }
        
        page = await self._get_page()

        try:
            print(f"[Scraper] Acessando série: {series_url}")
            await page.goto(series_url, wait_until='domcontentloaded', timeout=30000)
            await page.wait_for_timeout(2000)

            # Extrai título
            title_elem = await page.query_selector('h1.title, .drama-title h1, .info h1')
            if title_elem:
                series_info['title'] = (await title_elem.inner_text()).strip()

            # Extrai título original
            original_elem = await page.query_selector('.other-name, .alias, .original-title')
            if original_elem:
                series_info['original_title'] = (await original_elem.inner_text()).strip()

            # Extrai descrição
            desc_elem = await page.query_selector('.description, .summary, .synopsis')
            if desc_elem:
                series_info['description'] = (await desc_elem.inner_text()).strip()

            # Extrai lista de episódios
            episode_links = await page.query_selector_all('.episode-list a, .list-episode a, .episodios a')
            
            for ep_link in episode_links:
                try:
                    ep_text = await ep_link.inner_text()
                    ep_url = await ep_link.get_attribute('href')
                    
                    # Parse do número do episódio
                    ep_match = re.search(r'(\d+)', ep_text)
                    if ep_match:
                        series_info['episodes'].append({
                            'number': int(ep_match.group(1)),
                            'url': urljoin(KISSASIAN_BASE_URL, ep_url),
                            'title': ep_text.strip()
                        })
                except:
                    continue

            # Ordena episódios
            series_info['episodes'].sort(key=lambda x: x['number'])

        except PlaywrightTimeout:
            print(f"[Scraper] Timeout ao acessar série: {series_url}")
        except Exception as e:
            print(f"[Scraper] Erro ao processar série: {e}")
        finally:
            await page.close()

        return series_info

    def search_tmdb(self, title: str, origin_country: str = 'KR') -> Optional[Dict[str, Any]]:
        """
        Busca uma série no TMDB para obter o ID.
        
        Args:
            title: Título da série
            origin_country: País de origem (KR, JP, CN)
            
        Returns:
            Dados da série do TMDB ou None
        """
        if not TMDB_API_KEY:
            print("[TMDB] API Key não configurada")
            return None

        try:
            # Busca por título
            response = requests.get(
                f"{TMDB_BASE_URL}/search/tv",
                params={
                    'api_key': TMDB_API_KEY,
                    'language': 'pt-BR',
                    'query': title,
                    'page': 1
                },
                timeout=10
            )
            response.raise_for_status()
            data = response.json()

            if data['results']:
                # Tenta encontrar uma correspondência exata ou do país correto
                for result in data['results']:
                    if origin_country in result.get('origin_country', []):
                        return {
                            'id': result['id'],
                            'name': result['name'],
                            'original_name': result.get('original_name'),
                            'overview': result.get('overview'),
                            'poster_path': result.get('poster_path'),
                            'first_air_date': result.get('first_air_date'),
                            'origin_country': result.get('origin_country', [])
                        }
                
                # Se não encontrou do país específico, retorna o primeiro
                result = data['results'][0]
                return {
                    'id': result['id'],
                    'name': result['name'],
                    'original_name': result.get('original_name'),
                    'overview': result.get('overview'),
                    'poster_path': result.get('poster_path'),
                    'first_air_date': result.get('first_air_date'),
                    'origin_country': result.get('origin_country', [])
                }

        except Exception as e:
            print(f"[TMDB] Erro na busca: {e}")

        return None

    async def process_new_episodes(self):
        """
        Processo principal: busca atualizações e salva novos episódios.
        """
        print(f"\n{'='*50}")
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Iniciando verificação...")
        print(f"{'='*50}\n")

        # Busca atualizações
        updates = await self.scrape_latest_updates()
        print(f"[Scraper] {len(updates)} atualizações encontradas\n")

        new_episodes_count = 0

        for update in updates:
            try:
                title = update['title']
                series_url = update['url']
                latest_ep = update.get('latest_episode')

                print(f"[Processando] {title}")

                # Verifica se a série já existe no banco
                existing_series = self.db.get_series_by_url(series_url)

                if existing_series:
                    series_id = existing_series['id']
                    
                    # Verifica se o episódio já existe
                    if latest_ep and self.db.episode_exists(series_id, 1, latest_ep):
                        print(f"  → Episódio {latest_ep} já existe, pulando...")
                        continue
                else:
                    # Nova série - busca no TMDB
                    tmdb_data = self.search_tmdb(title)
                    tmdb_id = tmdb_data['id'] if tmdb_data else None
                    poster = tmdb_data.get('poster_path') if tmdb_data else None
                    origin = tmdb_data.get('origin_country', ['KR'])[0] if tmdb_data else 'KR'

                    # Adiciona série ao banco
                    series_id = self.db.add_series(
                        title=title,
                        tmdb_id=tmdb_id,
                        kissasian_url=series_url,
                        origin_country=origin,
                        poster_path=poster
                    )
                    print(f"  → Nova série adicionada (ID: {series_id}, TMDB: {tmdb_id})")

                # Scrape da página da série para obter episódios
                series_info = await self.scrape_series_page(series_url)

                # Adiciona episódios novos
                for ep in series_info['episodes']:
                    if not self.db.episode_exists(series_id, 1, ep['number']):
                        self.db.add_episode(
                            series_id=series_id,
                            episode_number=ep['number'],
                            source_url=ep['url'],
                            title=ep.get('title')
                        )
                        new_episodes_count += 1
                        print(f"  → Novo episódio {ep['number']} salvo")

                # Atualiza timestamp da série
                self.db.update_series_timestamp(series_id)

            except Exception as e:
                print(f"  → Erro: {e}")
                continue

        print(f"\n{'='*50}")
        print(f"[Resumo] {new_episodes_count} novo(s) episódio(s) adicionado(s)")
        stats = self.db.get_stats()
        print(f"[Banco] {stats['total_series']} séries | {stats['total_episodes']} episódios")
        print(f"{'='*50}\n")


async def main():
    """Função principal do scraper."""
    scraper = KissAsianScraper()
    
    try:
        await scraper.init_browser()
        await scraper.process_new_episodes()
    finally:
        await scraper.close_browser()


if __name__ == '__main__':
    print("""
╔══════════════════════════════════════════════════╗
║       EuDorama - KissAsian Scraper v1.0          ║
╠══════════════════════════════════════════════════╣
║  Monitorando novos episódios de doramas...       ║
╚══════════════════════════════════════════════════╝
    """)
    asyncio.run(main())
