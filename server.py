from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse
from urllib.parse import quote
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from datetime import datetime, timezone
import json
import os
import sqlite3
import time


ROOT = Path(__file__).resolve().parent
DATA_DIR = Path(os.environ.get("AGENDA_DATA_DIR", ROOT / "data"))
DB_PATH = DATA_DIR / "agenda.db"
PORT = int(os.environ.get("PORT", "4173"))
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
USE_SUPABASE = bool(SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)


def utc_now():
    return datetime.now(timezone.utc).isoformat()


def supabase_request(method, path, payload=None, prefer=None):
    if not USE_SUPABASE:
      raise RuntimeError("Supabase não configurado")
    body = None if payload is None else json.dumps(payload, ensure_ascii=False).encode("utf-8")
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    request = Request(f"{SUPABASE_URL}/rest/v1/{path}", data=body, headers=headers, method=method)
    try:
        with urlopen(request, timeout=20) as response:
            content = response.read().decode("utf-8")
            return json.loads(content) if content else None
    except HTTPError as error:
        detail = error.read().decode("utf-8")
        raise RuntimeError(detail or str(error)) from error


def db():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        """
        create table if not exists schedules (
          id text primary key,
          payload text not null,
          updated_at real not null
        )
        """
    )
    return conn


def read_all():
    if USE_SUPABASE:
        rows = supabase_request("GET", "schedules?select=payload") or []
        items = [row["payload"] for row in rows]
        return sorted(items, key=lambda item: f"{item.get('data', '')} {item.get('hora', '')}")
    with db() as conn:
        rows = conn.execute("select payload from schedules order by json_extract(payload, '$.data'), json_extract(payload, '$.hora')").fetchall()
    return [json.loads(row[0]) for row in rows]


def write_one(item):
    if USE_SUPABASE:
        payload = {
            "id": item["id"],
            "payload": item,
            "updated_at": utc_now(),
        }
        result = supabase_request(
            "POST",
            "schedules?on_conflict=id",
            payload,
            prefer="resolution=merge-duplicates,return=representation",
        )
        return result[0]["payload"] if result else item
    with db() as conn:
        conn.execute(
            "insert or replace into schedules (id, payload, updated_at) values (?, ?, ?)",
            (item["id"], json.dumps(item, ensure_ascii=False), time.time()),
        )
    return item


def delete_one(item_id):
    if USE_SUPABASE:
        supabase_request("DELETE", f"schedules?id=eq.{quote(item_id)}")
        return
    with db() as conn:
        conn.execute("delete from schedules where id = ?", (item_id,))


def replace_all(items):
    if USE_SUPABASE:
        supabase_request("DELETE", "schedules?id=neq.__never_match__", prefer="return=minimal")
        if items:
            payload = [{"id": item["id"], "payload": item, "updated_at": utc_now()} for item in items]
            supabase_request("POST", "schedules", payload, prefer="return=minimal")
        return
    with db() as conn:
        conn.execute("delete from schedules")
        conn.executemany(
            "insert into schedules (id, payload, updated_at) values (?, ?, ?)",
            [(item["id"], json.dumps(item, ensure_ascii=False), time.time()) for item in items],
        )


def parse_weight_kg(value):
    text = str(value or "").lower()
    has_ton = "ton" in text or "t" in text
    cleaned = "".join(ch for ch in text if ch.isdigit() or ch in ",.-")
    if not cleaned:
        return 0
    if "," in cleaned and "." in cleaned:
        cleaned = cleaned.replace(".", "").replace(",", ".")
    elif "," in cleaned:
        cleaned = cleaned.replace(",", ".")
    elif "." in cleaned:
        parts = cleaned.split(".")
        if len(parts[-1]) == 3:
            cleaned = "".join(parts)
    try:
        weight = float(cleaned)
    except ValueError:
        return 0
    return weight * 1000 if has_ton and weight < 1000 else weight


def duration(item):
    vehicle = str(item.get("veiculo", "")).lower()
    operation = item.get("operacao")
    weight = parse_weight_kg(item.get("peso"))
    if operation == "Expedicao" and "prancha" in vehicle and weight >= 10000:
        return 240
    if operation == "Descarga" and weight > 2500:
        return 90
    if "passeio" in vehicle:
        return 15
    if "pequeno" in vehicle:
        return 20
    if "medio" in vehicle or "médio" in vehicle or "van" in vehicle:
        return 30
    if "3/4" in vehicle or "truck" in vehicle or "trucado" in vehicle:
        return 40
    if "carreta" in vehicle or "prancha" in vehicle:
        return 60
    return int(item.get("duracaoMin") or 40)


def time_to_minutes(value):
    hours, minutes = str(value).split(":")[:2]
    return int(hours) * 60 + int(minutes)


def windows(item):
    dock = item.get("doca", "")
    if item.get("operacao") == "Expedicao" or "Portão 2" in dock or "Portao 2" in dock:
        return [(8 * 60, 12 * 60), (13 * 60 + 30, 17 * 60)]
    return [(8 * 60, 11 * 60 + 30), (13 * 60 + 30, 16 * 60)]


def inside_working_hours(item):
    start = time_to_minutes(item["hora"])
    end = start + duration(item)
    return any(start >= window_start and end <= window_end for window_start, window_end in windows(item))


def conflict(candidate, items):
    start = time_to_minutes(candidate["hora"])
    end = start + duration(candidate)
    for item in items:
        if item.get("id") == candidate.get("id"):
            continue
        if item.get("data") != candidate.get("data") or item.get("doca") != candidate.get("doca"):
            continue
        item_start = time_to_minutes(item["hora"])
        item_end = item_start + duration(item)
        if start < item_end and end > item_start:
            return item
    return None


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def send_json(self, status, data):
        encoded = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def read_json(self):
        length = int(self.headers.get("Content-Length", "0"))
        return json.loads(self.rfile.read(length).decode("utf-8") or "{}")

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/schedules":
            try:
                self.send_json(200, read_all())
            except Exception as error:
                self.send_json(500, {"error": f"Erro ao consultar banco central: {error}"})
            return
        if path == "/health":
            self.send_json(200, {"ok": True, "database": "supabase" if USE_SUPABASE else "sqlite"})
            return
        super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path
        if path == "/api/schedules":
            try:
                item = self.read_json()
                items = read_all()
                if not inside_working_hours(item):
                    self.send_json(409, {"error": "Horário fora da jornada de atendimento."})
                    return
                existing = conflict(item, items)
                if existing:
                    self.send_json(409, {"error": "Já existe agendamento nesse portão e horário.", "conflict": existing})
                    return
                saved = write_one(item)
                self.send_json(200, saved)
            except Exception as error:
                self.send_json(500, {"error": f"Erro ao salvar no banco central: {error}"})
            return
        if path == "/api/schedules/bulk":
            try:
                items = self.read_json().get("items", [])
                replace_all(items)
                self.send_json(200, {"ok": True, "count": len(items)})
            except Exception as error:
                self.send_json(500, {"error": f"Erro ao atualizar banco central: {error}"})
            return
        self.send_error(404)

    def do_DELETE(self):
        path = urlparse(self.path).path
        if path.startswith("/api/schedules/"):
            try:
                delete_one(path.rsplit("/", 1)[-1])
                self.send_json(200, {"ok": True})
            except Exception as error:
                self.send_json(500, {"error": f"Erro ao excluir no banco central: {error}"})
            return
        self.send_error(404)


if __name__ == "__main__":
    server = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print(f"Agenda Sandvik rodando em http://127.0.0.1:{PORT}")
    server.serve_forever()
