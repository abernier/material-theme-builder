# Tests Documentation

## Structure des tests / Test Structure

Ce projet contient deux suites de tests pour le composant `Mcu` :

### 1. `Mcu.test.tsx` - Tests de base

**Objectif**: Test simple de fumée (smoke test) pour vérifier que la fonctionnalité de base fonctionne.

**Contenu**:

- 1 test qui vérifie que le composant injecte correctement les variables CSS `--mcu-*`
- Test basique pour s'assurer que rien n'est cassé

**Quand l'utiliser**: Test rapide pour vérifier que les changements de base n'ont pas cassé le composant.

### 2. `Mcu.rsc.test.tsx` - Tests RSC (React Server Components)

**Objectif**: Suite de tests complète pour vérifier la compatibilité avec les environnements RSC (comme Next.js App Router).

**Contenu** (8 tests):

1. **Rendu du composant client** (3 tests):
   - Injection des variables CSS dans le contexte client
   - Gestion de différents schémas de couleurs (vibrant, tonalSpot, etc.)
   - Support des couleurs personnalisées

2. **Hook useMcu dans le contexte client** (3 tests):
   - Accès aux méthodes du contexte (initials, setMcuConfig, getMcuColor)
   - Changements dynamiques de couleurs via `setMcuConfig`
   - Récupération des valeurs de couleur via `getMcuColor`

3. **Simulation d'import côté serveur** (2 tests):
   - Import de `Mcu` sans erreurs (simule un import côté serveur)
   - Import de `useMcu` sans erreurs

**Quand l'utiliser**: Pour vérifier que le composant fonctionne correctement dans des environnements RSC où `"use client"` est critique.

## Différences clés / Key Differences

| Aspect                         | Mcu.test.tsx           | Mcu.rsc.test.tsx             |
| ------------------------------ | ---------------------- | ---------------------------- |
| **Nombre de tests**            | 1 test                 | 8 tests                      |
| **Portée**                     | Fonctionnalité de base | Compatibilité RSC complète   |
| **Schémas de couleurs testés** | tonalSpot uniquement   | tonalSpot + vibrant          |
| **Couleurs personnalisées**    | Non testé              | Testé avec 2 couleurs custom |
| **Hook useMcu**                | Non testé              | 3 tests dédiés               |
| **Mises à jour dynamiques**    | Non testé              | Testé (setMcuConfig)         |
| **Imports côté serveur**       | Non testé              | Testé (simulation RSC)       |

## Pourquoi deux fichiers séparés ? / Why Two Separate Files?

1. **Séparation des préoccupations**:
   - Le test de base vérifie que le composant fonctionne
   - Les tests RSC vérifient qu'il fonctionne dans des environnements spécifiques

2. **Performance**:
   - Les tests de base sont rapides à exécuter
   - Les tests RSC sont plus complets mais prennent plus de temps

3. **Clarté**:
   - Il est clair quelle fonctionnalité est testée et pourquoi
   - Les développeurs peuvent facilement comprendre l'intention de chaque suite

## Lancer les tests / Running Tests

```bash
# Tous les tests
pnpm test

# Tests de base uniquement
pnpm test Mcu.test.tsx

# Tests RSC uniquement
pnpm test Mcu.rsc.test.tsx
```

## Lien avec PR #50

La PR #50 a ajouté la directive `"use client"` pour supporter les RSC. Les tests RSC garantissent que cette fonctionnalité continue de fonctionner correctement.
