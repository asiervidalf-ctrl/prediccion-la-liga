"""Actualiza la caché de jugadores desde las páginas públicas de FútbolFantasy."""

import json
import time
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://www.futbolfantasy.com/laliga/equipos/"
OUTPUT = Path(__file__).resolve().parent / "data" / "players.json"
TEAMS = {
    "alaves": "Deportivo Alavés",
    "athletic": "Athletic Club",
    "atletico": "Atlético de Madrid",
    "barcelona": "FC Barcelona",
    "betis": "Real Betis",
    "celta": "RC Celta",
    "deportivo": "RC Deportivo",
    "elche": "Elche CF",
    "espanyol": "RCD Espanyol",
    "getafe": "Getafe CF",
    "levante": "Levante UD",
    "malaga": "Málaga CF",
    "osasuna": "CA Osasuna",
    "racing": "Racing Club",
    "rayo-vallecano": "Rayo Vallecano",
    "real-madrid": "Real Madrid",
    "real-sociedad": "Real Sociedad",
    "sevilla": "Sevilla FC",
    "valencia": "Valencia CF",
    "villarreal": "Villarreal CF",
}


def image_url(image) -> str:
    for attribute in ("data-src", "data-original", "data-lazy-src", "src"):
        value = image.get(attribute)
        if value and not value.startswith("data:"):
            return urljoin("https://www.futbolfantasy.com", value)
    return ""


def scrape_team(session: requests.Session, slug: str, club: str) -> list[dict[str, str]]:
    response = session.get(f"{BASE_URL}{slug}", timeout=35)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    players: dict[str, dict[str, str]] = {}

    for link in soup.select('a[href*="/jugadores/"]'):
        image = link.find("img", alt=True)
        if image is None:
            continue
        name = image.get("alt", "").strip()
        photo = image_url(image)
        if not name or not photo or name.lower() in {"más info", "alineación"}:
            continue
        profile = urljoin("https://www.futbolfantasy.com", link.get("href", ""))
        players[name.casefold()] = {"name": name, "club": club, "photo": photo, "profile": profile}

    return list(players.values())


def main() -> None:
    session = requests.Session()
    session.headers["User-Agent"] = "PorraCaralleiro/1.0 (personal football predictions app)"
    players: list[dict[str, str]] = []
    for index, (slug, club) in enumerate(TEAMS.items(), start=1):
        try:
            team_players = scrape_team(session, slug, club)
        except requests.RequestException as error:
            print(f"[{index:02}/{len(TEAMS)}] {club}: error ({error})")
            continue
        players.extend(team_players)
        print(f"[{index:02}/{len(TEAMS)}] {club}: {len(team_players)} jugadores")
        time.sleep(0.25)

    unique = {(player["name"].casefold(), player["club"]): player for player in players}
    result = sorted(unique.values(), key=lambda player: player["name"].casefold())
    OUTPUT.parent.mkdir(exist_ok=True)
    OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Guardados {len(result)} jugadores en {OUTPUT}")


if __name__ == "__main__":
    main()
