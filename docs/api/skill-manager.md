# SkillManager

Gestisce l'albero delle abilità (DAG), i punti skill e l'iniezione dei modificatori passivi. Accessibile via `engine.skills`.

```typescript
import { SkillManager } from 'catalyst-engine';
```

Guida concettuale: [Albero delle skill](/guide/skill).

## Costruttore

```typescript
new SkillManager(statManager: StatManager, eventBus: EngineEventBus)
```

Riceve **per dependency injection** lo `StatManager` (per iniettare i modificatori passivi) e l'`EngineEventBus` (per emettere `STAT_CHANGED`). Istanziato automaticamente dal [`CatalystEngine`](/api/catalyst-engine).

## Proprietà

| Proprietà | Tipo | Descrizione |
| --- | --- | --- |
| `skillPoints` (getter) | `number` | Punti skill disponibili. |

## Metodi

### `loadSkillTree()`

```typescript
loadSkillTree(config: ISkillNode[]): void
```

Carica i nodi dell'albero. Ogni nodo viene clonato con `currentLevel` forzato a `0`.

```typescript
engine.skills.loadSkillTree(skillTreeJson);
```

### `addSkillPoints()`

```typescript
addSkillPoints(points: number): void
```

Aggiunge punti skill spendibili. Il facade ne aggiunge automaticamente `2` per ogni livello guadagnato.

### `getSkill()`

```typescript
getSkill(skillId: string): ISkillNode | undefined
```

Ritorna il nodo skill, o `undefined` se non esiste.

### `upgradeSkill()`

```typescript
upgradeSkill(skillId: string, playerLevel: number): ISkillUnlockResult
```

Tenta di potenziare la skill di un livello. Esegue le verifiche in ordine e ritorna un [`ISkillUnlockResult`](/api/interfacce#iskillunlockresult). Se ha successo: scala i punti, incrementa `currentLevel`, inietta/aggiorna i modificatori passivi (per le skill `PASSIVE`) ed emette `STAT_CHANGED`.

| `reason` di fallimento | Causa |
| --- | --- |
| `NOT_FOUND` | skill inesistente |
| `MAX_LEVEL` | già al livello massimo |
| `NO_POINTS` | punti insufficienti |
| `LOW_LEVEL` | livello giocatore troppo basso |
| `MISSING_PREREQUISITES` | prerequisito non sbloccato |

```typescript
const res = engine.skills.upgradeSkill('forza_bruta', engine.exp.currentLevel);
if (!res.success) console.log(res.reason);
```

### `exportState()`

```typescript
exportState(): { unspentPoints: number; unlockedSkills: Record<string, number> }
```

Esporta punti non spesi e skill sbloccate (`id → livello`), includendo solo quelle con `currentLevel > 0`. Usato da [`save()`](/api/catalyst-engine#save).

### `importState()`

```typescript
importState(state: { unspentPoints: number; unlockedSkills: Record<string, number> }): void
```

Ripristina punti e livelli delle skill, azzerando prima tutto l'albero, e **ri-inietta i modificatori passivi** nelle statistiche. Usato da [`load()`](/api/catalyst-engine#load).
