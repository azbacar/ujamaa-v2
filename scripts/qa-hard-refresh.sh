#!/usr/bin/env bash
# ============================================================
# Ujamaan — QA hard-refresh / cache purge / iPhone Safari
# ------------------------------------------------------------
# Vérifie qu'un déploiement déclenche bien la purge auto du cache
# côté client et que la dernière UI est servie. À exécuter depuis
# la machine d'un dev — pas en CI.
#
# Usage :
#   bash scripts/qa-hard-refresh.sh https://ujamaan.com
# ============================================================
set -euo pipefail

URL="${1:-https://ujamaan.com}"
TMP="$(mktemp -d)"
echo "▶︎ QA hard-refresh sur : $URL"
echo "  Dossier temporaire : $TMP"
echo

pass() { echo "  ✅ $1"; }
fail() { echo "  ❌ $1"; FAIL=1; }
FAIL=0

echo "1) Récupération du HTML"
curl -sSL -A "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15" \
  "$URL/?_t=$(date +%s)" -o "$TMP/index.html"
test -s "$TMP/index.html" && pass "HTML reçu ($(wc -c <"$TMP/index.html") octets)" \
  || fail "HTML vide"
echo

echo "2) Headers anti-cache présents dans le HTML"
grep -qi 'http-equiv="Cache-Control"' "$TMP/index.html" \
  && pass "<meta Cache-Control> trouvé" || fail "<meta Cache-Control> manquant"
grep -qi 'no-cache' "$TMP/index.html" \
  && pass "directive no-cache présente" || fail "no-cache absent"
echo

echo "3) Désinscription Service Worker présente"
grep -q 'serviceWorker' "$TMP/index.html" && grep -q 'unregister' "$TMP/index.html" \
  && pass "script de désinscription SW présent" \
  || fail "script de désinscription SW absent"
echo

echo "4) Filet de sécurité iOS (bouton Réinitialiser et recharger)"
grep -q 'ujRepair' "$TMP/index.html" \
  && pass "bouton de récupération iOS présent" \
  || fail "bouton de récupération iOS absent"
echo

echo "5) Compatibilité iOS (no apple-mobile-web-app-capable)"
if grep -qE 'apple-mobile-web-app-capable"[[:space:]]+content="no"' "$TMP/index.html"; then
  pass "PWA standalone désactivé sur iOS"
else
  fail "balise apple-mobile-web-app-capable=no manquante"
fi
echo

echo "6) Asset JS principal versionné (cache-busting Vite)"
ASSET=$(grep -oE '/assets/[^"]+\.js' "$TMP/index.html" | head -1 || true)
if [ -n "$ASSET" ]; then
  pass "asset détecté : $ASSET"
  curl -sSI "$URL$ASSET" -o "$TMP/asset.headers"
  if grep -qiE '^(cache-control|etag):' "$TMP/asset.headers"; then
    pass "asset sert des headers cacheables (immutable hash)"
  else
    fail "headers cache absents sur l'asset"
  fi
else
  fail "aucun asset /assets/*.js trouvé dans le HTML"
fi
echo

echo "7) HTML lui-même non-cacheable côté CDN"
curl -sSI "$URL/" -o "$TMP/html.headers"
if grep -qiE 'cache-control:.*(no-cache|no-store|max-age=0)' "$TMP/html.headers"; then
  pass "HTML servi avec no-cache au niveau HTTP"
else
  echo "  ⚠️  HTML potentiellement caché par le CDN — vérifier manuellement"
fi
echo

echo "============================================"
if [ "$FAIL" = "0" ]; then
  echo "✅ Toutes les vérifications automatiques sont passées."
  echo "   → Compléter avec la checklist manuelle iPhone : docs/QA_HARD_REFRESH_CHECKLIST.md"
  exit 0
else
  echo "❌ Certaines vérifications ont échoué."
  exit 1
fi
