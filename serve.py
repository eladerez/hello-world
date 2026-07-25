#!/usr/bin/env python3
"""Serve this directory with caching disabled, so browser refreshes always
pick up the latest files during active development, plus a tiny JSON API
(/api/state) so added questions/hidden questions/explanations are shared
across every device that opens the site instead of being stuck in one
browser's localStorage."""
import http.server
import json
import os
import socketserver
import tempfile

PORT = 8080
DIRECTORY = "."
DATA_FILE = os.path.join(DIRECTORY, "data-store.json")
DEFAULT_STATE = {"customQuestions": [], "hiddenIds": [], "textAnnotations": []}


def read_state():
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return dict(DEFAULT_STATE)


def write_state(state):
    fd, tmp_path = tempfile.mkstemp(dir=DIRECTORY, prefix=".data-store-", suffix=".json")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(state, f)
        os.replace(tmp_path, DATA_FILE)
    except Exception:
        os.unlink(tmp_path)
        raise


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        super().end_headers()

    def do_GET(self):
        if self.path == "/api/state":
            if not os.path.exists(DATA_FILE):
                # Nothing has ever been synced to this server yet — 404 (not
                # an empty state) so a device with existing browser-local
                # data knows to migrate it up instead of treating "empty" as
                # the real, already-synced truth.
                self.send_response(404)
                self.end_headers()
                return
            body = json.dumps(read_state()).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()

    def do_POST(self):
        if self.path != "/api/state":
            self.send_response(404)
            self.end_headers()
            return
        try:
            length = int(self.headers.get("Content-Length", 0))
            raw = self.rfile.read(length)
            state = json.loads(raw)
            if not isinstance(state, dict):
                raise ValueError("state must be a JSON object")
            write_state(state)
            self.send_response(204)
            self.end_headers()
        except (ValueError, json.JSONDecodeError):
            self.send_response(400)
            self.end_headers()


class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True


if __name__ == "__main__":
    with ReusableTCPServer(("0.0.0.0", PORT), NoCacheHandler) as httpd:
        print(f"Serving {DIRECTORY} on port {PORT} with caching disabled")
        print(f"Shared question/explanation data stored in {DATA_FILE}")
        httpd.serve_forever()
