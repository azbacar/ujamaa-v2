# ✅ Checklist QA — Hard refresh + purge cache (iPhone Safari)

> Objectif : garantir qu'après un déploiement, **tout utilisateur iPhone** récupère la dernière version sans se retrouver bloqué sur une page blanche ou une vieille UI.

## 1. Pré-requis
- Un iPhone réel (Safari iOS 15+).
- Une version `N` déjà visitée sur https://ujamaan.com.
- Un nouveau déploiement en attente (version `N+1`).

## 2. Tests automatiques (à lancer depuis n'importe quel poste)

```bash
# Vérifie les headers, la désinscription SW, le filet iOS et le cache-busting Vite
bash scripts/qa-hard-refresh.sh https://ujamaan.com

# Vérifie la logique checksum/version côté code
bunx vitest run src/lib/__tests__/datasetChecksum.test.ts
```

Les deux scripts doivent renvoyer ✅ avant de passer à la partie manuelle.

## 3. Checklist manuelle iPhone Safari

### A. Avant déploiement (version N)
- [ ] Ouvrir https://ujamaan.com sur iPhone, naviguer dans **Prix** et **Événements**.
- [ ] Noter dans la console (Safari Dev Tools, Mac branché) la valeur de :
  ```js
  localStorage.getItem('ujamaan_app_version')
  sessionStorage.getItem('ujamaan_ds_checksum_prices')
  ```
- [ ] Mettre l'iPhone en veille (sans fermer Safari).

### B. Pendant le déploiement
- [ ] Déclencher le déploiement (push/Lovable publish).
- [ ] Attendre que la nouvelle version soit en ligne (vérifier `__APP_VERSION__` via `view-source` ou network).

### C. Après déploiement (version N+1)
- [ ] Re-réveiller l'iPhone, **recharger la page** (tirer vers le bas).
- [ ] Vérifier dans la console que :
  - [ ] `localStorage.getItem('ujamaan_app_version')` a changé pour la nouvelle valeur.
  - [ ] Aucun ancien composant n'apparaît (logos, libellés…).
  - [ ] Un événement `ujamaan:dataset-stale` est émis lors du premier fetch (écouter avec `window.addEventListener('ujamaan:dataset-stale', e => console.log(e.detail))`).
- [ ] Vérifier qu'**aucune page blanche ne dure plus de 8 secondes** : si oui, le filet HTML doit afficher le bouton **« Réinitialiser et recharger »**.
- [ ] Cliquer sur ce bouton : la page doit se recharger proprement et afficher le nouveau contenu.

### D. Test de récupération (corruption simulée)
- [ ] Dans la console Safari :
  ```js
  localStorage.setItem('sb-vpibvgdpeiicczelbynf-auth-token', 'invalid-corrupt-data');
  localStorage.setItem('ujamaan_app_version', 'will-be-purged');
  ```
- [ ] Recharger : la page ne doit pas crasher, elle doit purger l'item invalide et recharger normalement (au pire afficher le filet 8s).

### E. Cohérence des données (checksum)
- [ ] Modifier un prix dans l'admin (changer la valeur d'un prix publié).
- [ ] Sur l'iPhone, recharger la page **Prix**.
- [ ] Confirmer dans la console qu'un événement `ujamaan:dataset-stale` est émis avec `reason: "checksum_changed"`.
- [ ] La valeur affichée à l'écran doit correspondre à celle de l'admin.

### F. Connexion lente (3G simulée)
- [ ] Réglages → Développement → Network Link Conditioner → 3G.
- [ ] Recharger la page. Vérifier qu'aucune page blanche définitive n'apparaît.

## 4. Critères de réussite
- ✅ 100% des tests automatiques passent.
- ✅ Aucune page blanche > 8s.
- ✅ Le filet iOS s'affiche correctement quand testé manuellement.
- ✅ `localStorage` conserve les clés critiques (`sb-*`, `ujamaan_app_version`, `cookie_consent`) après purge auto.
- ✅ Les événements `ujamaan:dataset-stale` apparaissent quand un dataset change.

## 5. Si un test échoue
1. Capturer la console Safari (Mac → Safari → Développement → iPhone).
2. Vérifier le commit qui a introduit le problème.
3. Ouvrir un ticket avec :
   - Version iOS / Safari
   - Étape de la checklist qui a échoué
   - Capture console + screenshot

---
**Doc maintenue par** : Équipe Ujamaan / AZZHY
**Dernière révision** : 2026-04-28
