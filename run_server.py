#!/usr/bin/env python3
"""
DE Mastery Pro — Zero to Hero Data Engineering Academy
1-Click Local Server & PWA Launcher
"""
import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8000

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS and caching headers suitable for PWA development
        self.send_header('Cache-Control', 'no-cache, must-revalidate')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    port = PORT
    server = None
    for p in range(PORT, PORT + 20):
        try:
            server = socketserver.TCPServer(("", p), Handler)
            port = p
            break
        except OSError:
            continue
            
    if not server:
        print("❌ Could not bind to any port between 8000 and 8020.")
        sys.exit(1)
        
    url = f"http://localhost:{port}"
    print("=" * 65)
    print("🚀 DE MASTERY PRO — DATA ENGINEERING ACADEMY 2026")
    print("=" * 65)
    print(f"✨ Server running locally at: {url}")
    print(f"💡 Opening your default web browser now...")
    print(f"📱 To install as Desktop / Mobile App:")
    print(f"   - On Laptop: Click 'Install' in browser address bar (Chrome/Edge)")
    print(f"   - On Mobile: Host on GitHub Pages/Netlify or connect via local IP")
    print(f"⏹  Press Ctrl+C anytime to stop this server")
    print("=" * 65)
    
    webbrowser.open(url)
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Server stopped. Happy learning and all the best!")

if __name__ == '__main__':
    main()
