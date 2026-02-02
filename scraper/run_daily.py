"""
Script de agendamento diário para o scraper do KissAsian.
Executa o scraper automaticamente em horários configurados.
"""

import asyncio
import schedule
import time
from datetime import datetime
import sys
import os

# Adiciona o diretório atual ao path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from kissasian_scraper import KissAsianScraper


async def run_scraper():
    """Executa o scraper uma vez."""
    scraper = KissAsianScraper()
    try:
        await scraper.init_browser()
        await scraper.process_new_episodes()
    except Exception as e:
        print(f"[Erro] Falha na execução: {e}")
    finally:
        await scraper.close_browser()


def job():
    """Função wrapper para o schedule."""
    print(f"\n[Scheduler] Iniciando tarefa agendada - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    asyncio.run(run_scraper())


def main():
    """Função principal do agendador."""
    print("""
╔══════════════════════════════════════════════════╗
║     EuDorama - Agendador de Scraping v1.0        ║
╠══════════════════════════════════════════════════╣
║  O scraper será executado automaticamente:       ║
║  • 08:00 - Manhã                                 ║
║  • 14:00 - Tarde                                 ║
║  • 20:00 - Noite                                 ║
║  • 02:00 - Madrugada                             ║
║                                                  ║
║  Pressione Ctrl+C para encerrar                  ║
╚══════════════════════════════════════════════════╝
    """)

    # Agenda as execuções diárias
    schedule.every().day.at("08:00").do(job)
    schedule.every().day.at("14:00").do(job)
    schedule.every().day.at("20:00").do(job)
    schedule.every().day.at("02:00").do(job)

    # Executa imediatamente na primeira vez
    print("[Scheduler] Executando verificação inicial...")
    job()

    # Loop de agendamento
    print("\n[Scheduler] Aguardando próxima execução agendada...")
    while True:
        schedule.run_pending()
        time.sleep(60)  # Verifica a cada minuto


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n[Scheduler] Encerrado pelo usuário.")
        sys.exit(0)
