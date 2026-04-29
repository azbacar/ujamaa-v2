#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Ujamaan — Durcissement automatique des réglages Auth Supabase
#
# Applique en une commande les 2 recommandations sécurité du linter :
#   ✅ OTP expiry    → 600 sec (10 min)  [recommandé < 3600]
#   ✅ HIBP password → activé (refus des mots de passe compromis)
#
# Bonus appliqués (sans risque) :
#   ✅ Désactive les inscriptions anonymes
#   ✅ Force email confirmation
#
# ─── Prérequis ────────────────────────────────────────────────────────────────
# 1. Créer un Personal Access Token (PAT) Supabase :
#       https://supabase.com/dashboard/account/tokens
# 2. L'exporter avant de lancer le script :
#       export SUPABASE_ACCESS_TOKEN="sbp_xxxxxxxxxxxxxxxxxxxxxxxx"
# 3. Lancer :
#       bash scripts/supabase-auth-harden.sh
#
# Le PAT n'est JAMAIS stocké dans le repo. Il reste local à ta machine.
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

PROJECT_REF="vpibvgdpeiicczelbynf"   # Ujamaan production
OTP_EXPIRY_SECONDS=600               # 10 minutes

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "❌ Variable SUPABASE_ACCESS_TOKEN manquante."
  echo "   1) Génère un PAT : https://supabase.com/dashboard/account/tokens"
  echo "   2) export SUPABASE_ACCESS_TOKEN=\"sbp_...\""
  echo "   3) Relance ce script."
  exit 1
fi

echo "🔧 Application du durcissement Auth sur le projet $PROJECT_REF…"

RESPONSE=$(curl -sS -w "\n%{http_code}" \
  -X PATCH "https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"mailer_otp_exp\": ${OTP_EXPIRY_SECONDS},
    \"sms_otp_exp\": ${OTP_EXPIRY_SECONDS},
    \"password_hibp_enabled\": true,
    \"password_min_length\": 8,
    \"external_anonymous_users_enabled\": false,
    \"mailer_autoconfirm\": false
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [[ "$HTTP_CODE" =~ ^2 ]]; then
  echo "✅ Réglages Auth mis à jour avec succès :"
  echo "   • OTP expiry : ${OTP_EXPIRY_SECONDS}s (10 min)"
  echo "   • HIBP password protection : ON"
  echo "   • Inscriptions anonymes : OFF"
  echo "   • Confirmation email : ON"
  echo "   • Longueur min mot de passe : 8"
else
  echo "❌ Échec (HTTP $HTTP_CODE) :"
  echo "$BODY"
  exit 1
fi
