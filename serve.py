#!/usr/bin/env python3
"""Serve this directory with caching disabled, so browser refreshes always
pick up the latest files during active development."""
import http.server
import socketserver

PORT = 8080
DIRECTORY = "."


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        super().end_headers()


class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True


if __name__ == "__main__":
    with ReusableTCPServer(("0.0.0.0", PORT), NoCacheHandler) as httpd:
        print(f"Serving {DIRECTORY} on port {PORT} with caching disabled")
        httpd.serve_forever()
