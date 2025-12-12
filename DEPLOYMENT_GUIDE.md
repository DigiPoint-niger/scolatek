# 🚀 GUIDE DE DÉPLOIEMENT - Scolatek

**Date**: 11 Décembre 2025  
**Version**: 1.0  
**Status**: ✅ PRÊT POUR PRODUCTION

---

## ⚡ Quick Start (5 minutes)

```bash
# 1. Vérifier les changements
git status
# Devrait montrer 3 fichiers modifiés:
#   src/app/dashboard/teacher/absences/page.jsx
#   src/app/dashboard/teacher/grades/page.jsx
#   src/app/dashboard/teacher/homeworks/page.jsx

# 2. Build
npm run build
# ✅ Attendu: Zéro errors

# 3. Lint
npm run lint
# ✅ Attendu: OK

# 4. Test Local (Optionnel)
npm run dev
# ✅ Attendu: App démarre, pages chargent

# 5. Deploy
npm run deploy
# ✅ Attendu: Déploiement réussi
```

---

## 📋 Checklist Pré-Déploiement

### Vérifications Code
- [ ] `npm run build` → Zéro errors
- [ ] `npm run lint` → Zéro warnings critiques
- [ ] `git status` → Pas de fichiers uncommitted
- [ ] `git diff` → Changements valides

### Vérifications Fonctionnelles (Local)
```bash
npm run dev
# Puis tester:
# 1. Teacher absences: Ajouter une absence
# 2. Teacher grades: Ajouter une note (validation 0-20)
# 3. Teacher homeworks: Ajouter un devoir
# 4. Vérifier dropdowns se peuplent
# 5. Vérifier exports PDF/Excel
```

### Vérifications DB
- [ ] Supabase connectée OK
- [ ] Pas de migrations en attente
- [ ] RLS policies actives
- [ ] Backups récents existants

### Vérifications Team
- [ ] Notifier team du déploiement
- [ ] Plan de rollback prêt
- [ ] Support dispo après déploiement

---

## 🔄 Processus de Déploiement

### Option 1: GitHub Actions (Recommandé)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install & Build
        run: |
          npm install
          npm run build
          npm run lint
      
      - name: Deploy
        run: npm run deploy
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

### Option 2: Manual Deployment

```bash
# 1. Build
npm run build

# 2. Test build output
npm run start
# Vérifier http://localhost:3000

# 3. Deploy to hosting
# (Depends on your setup: Vercel, Netlify, custom)
npm run deploy
```

### Option 3: Docker (Si applicable)

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t scolatek:latest .
docker push scolatek:latest
# Deploy via your orchestration (K8s, ECS, etc.)
```

---

## 📊 Changements Déployés

### Fichier 1: `teacher/absences/page.jsx`
```diff
- Inputs texte pour IDs
+ Dropdowns intelligents
- Pas de validation
+ Validation complète
- Styling basique
+ Styling Tailwind pro
```

### Fichier 2: `teacher/grades/page.jsx`
```diff
- ReferenceError possible
+ Code safe (states avant functions)
- Inputs texte pour IDs
+ Dropdowns intelligents
- Pas de validation notes
+ Validation 0-20, décimales
```

### Fichier 3: `teacher/homeworks/page.jsx`
```diff
- Inputs texte pour classe/matière
+ Dropdowns intelligents
- Pas de fetch class/subject
+ Fetch depuis DB
- Date handling basique
+ Timestamp with timezone
```

---

## ✅ Vérifications Post-Déploiement

### Immédiatement Après (15 minutes)

```bash
# 1. Vérifier app démarre
curl https://your-app.com
# ✅ Attendu: Page charge, 200 OK

# 2. Vérifier logs Supabase
# Dashboard → Logs → Vérifier 0 errors

# 3. Smoke test
# - Login comme teacher
# - Aller à /dashboard/teacher/absences
# - ✅ Page charge
# - ✅ Dropdown élève se peuple
# - ✅ Formulaire fonctionne
```

### Après 1 Heure

```bash
# 4. Vérifier metrics
# - Check analytics
# - Check error tracking (Sentry if configured)
# - ✅ Zéro spikes d'erreurs

# 5. Vérifier data
# - Vérifier au moins 1 transaction réussie
# - Vérifier data intégrité
# - ✅ Data sauvegardée correctement
```

### Après 24 Heures

```bash
# 6. Report
# - Réunion retrospective
# - Feedback utilisateurs
# - Performance metrics
# - ✅ Success rate > 99%
```

---

## 🆘 Troubleshooting

### Issue: Build Failed
```bash
# Solution:
npm cache clean --force
npm install
npm run build
```

### Issue: Lint Errors
```bash
# Solution:
npm run lint -- --fix
git add .
npm run lint
```

### Issue: Page Blank After Deploy
```bash
# Solutions:
# 1. Clear browser cache (Ctrl+Shift+Delete)
# 2. Hard reload (Ctrl+Shift+R)
# 3. Check console errors (F12)
# 4. Check Supabase connection
```

### Issue: Dropdowns Empty
```bash
# Debug:
# 1. Vérifier Supabase connectée
# 2. Vérifier school_id utilisateur
# 3. Vérifier data existe en DB
# 4. Check network tab (F12)
```

### Issue: Form Submit Fails
```bash
# Debug:
# 1. Vérifier pas d'erreur console
# 2. Vérifier validation input
# 3. Vérifier Supabase RLS policies
# 4. Vérifier quota Supabase
```

---

## 🔄 Rollback Plan

Si vous devez revenir en arrière:

```bash
# 1. Identifier le commit avant changes
git log --oneline
# Exemple: a1b2c3d Fix teacher forms

# 2. Créer revert commit
git revert a1b2c3d
# Ou direct rollback:
git reset --hard HEAD~1

# 3. Rebuild et redeploy
npm run build
npm run deploy

# 4. Notification
# "Scolatek reverted to previous version due to [reason]"
# "ETA for fix: [time]"
```

---

## 📞 Support & Escalation

### L1: Self-Service (5 min)
- Vérifier documentation
- Check CHANGELOG.md
- Vérifier console errors

### L2: Team Support (30 min)
- Créer GitHub issue
- Notifier team Slack
- Share error logs

### L3: Escalation (1 hour)
- Contact engineering lead
- Prepare rollback
- Post-mortem analysis

---

## 📈 Monitoring

### Métriques à Tracker

```
Page Load Times:
  teacher/absences: < 2s ✅
  teacher/grades: < 2s ✅
  teacher/homeworks: < 2s ✅

Form Submission Times:
  Add absence: < 1s ✅
  Add grade: < 1s ✅
  Add homework: < 1s ✅

Error Rates:
  Target: < 0.1% ❌
```

### Outils de Monitoring

```
1. Supabase Dashboard
   → Logs → Check errors
   → Metrics → Check queries

2. Sentry (if configured)
   → Issues → Check new errors
   → Releases → Track version

3. Google Analytics (if configured)
   → Behavior → Check pages
   → Conversions → Check goals

4. Custom Dashboards
   → Monitor business metrics
   → Alert on anomalies
```

---

## 📝 Documentation Post-Déploiement

Après deployment réussi, mettre à jour:

```
[ ] CHANGELOG.md → Ajouter date/heure déployement
[ ] Version → Bump to 1.1.0
[ ] Release Notes → Documenter changements
[ ] Team Wiki → Notifier team
[ ] Jira/Issues → Mark as deployed
```

---

## 🎯 Success Criteria

Déploiement considéré comme **SUCCESS** si:

✅ Build réussit sans errors  
✅ App démarre correctement  
✅ Pages chargent < 2 secondes  
✅ Formulaires submitent < 1 seconde  
✅ 0 errors dans logs Supabase  
✅ 0 console errors en browser  
✅ Au moins 1 utilisateur a utilisé la feature  
✅ Pas d'escalations  

---

## 🎉 Célébration!

Si tous les critères sont met:

```
🎊 DÉPLOIEMENT RÉUSSI! 🎊

Merci d'avoir contribué à l'amélioration
de Scolatek! ✨

Version 1.1.0 est maintenant en production.

Suivez les metrics et soyez à l'écoute
pour feedback utilisateurs.

À bientôt pour la prochaine release! 🚀
```

---

## 📚 Ressources Utiles

- [Next.js Deployment](https://nextjs.org/docs/deployment/vercel)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [GitHub Actions](https://docs.github.com/en/actions)

---

## ❓ Questions Fréquentes

**Q: Combien de temps le déploiement prend?**  
R: 5-10 minutes généralement

**Q: Dois-je notify les utilisateurs?**  
R: Oui, communicate les changements

**Q: Et si quelque chose casse?**  
R: Rollback possible en < 5 minutes

**Q: Les données existantes sont sûres?**  
R: Oui, zéro changes DB schema

**Q: Quand est le meilleur moment pour déployer?**  
R: En heures creuses (tôt matin ou tard soir)

---

## 📋 Final Checklist

- [ ] Code reviewed
- [ ] Tests passent
- [ ] Build succeeds
- [ ] Pre-deploy checks done
- [ ] Team notified
- [ ] Rollback plan ready
- [ ] Monitoring configured
- [ ] Support dispo
- [ ] Documentation updated
- [ ] 🚀 DEPLOY!

---

**Ready to Deploy!** 🚀

Questions? Contactez le team engineering.

---

**Document Version**: 1.0  
**Last Updated**: 11 Décembre 2025  
**Next Review**: Après premier déploiement production
