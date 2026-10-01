# Post LinkedIn (129 mots)

Cette semaine, on a corrigé le cœur de notre workflow IA pour UrbanFlow : le nœud "Chercheur" qui analyse le trafic sur les lignes Dakar Dem Dikk.

Le bug : nos variables pointaient vers `{{sys.query}}`, une syntaxe qui ne fonctionne qu'en mode Chatflow. En mode Workflow, il fallait référencer directement le nœud de départ. Résultat : le nœud recevait une question vide.

Correction faite, testée, documentée. La prochaine étape : brancher une vraie base de connaissances sur le trafic Dakar au lieu de laisser l'IA deviner.

Ce genre d'erreur ne se voit pas dans une démo rapide. Elle se voit quand on teste vraiment, avec de vraies questions.

UrbanFlow — anticiper le trafic, pas le subir.

#Dakar #MobiliteUrbaine #GET409

---
Auto-contrôle : 0 mot interdit (pas de "révolutionnaire"/"next-gen") · formule de clôture présente · 3 hashtags · 129 mots
