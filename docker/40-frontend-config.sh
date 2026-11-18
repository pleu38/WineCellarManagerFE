#!/bin/sh
set -eu

# La configuration Docker ne livre jamais l'API_KEY au navigateur :
# seul Nginx ajoute cet en-tête à la requête vers le backend.
printf '%s\n' 'window.__WINECELLAR_CONFIG__ = { apiBaseUrl: "/api", apiKey: "" };' > /usr/share/nginx/html/config.js
