# Albero delle skill

Lo [`SkillManager`](/api/skill-manager) gestisce le abilità come un **grafo orientato (DAG)**: ogni nodo dichiara prerequisiti di livello e di sblocco, ed è definibile interamente via JSON.

## Definire un nodo skill

Un nodo è un [`ISkillNode`](/api/interfacce#iskillnode):

```typescript
interface ISkillNode {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  currentLevel: number;          // sempre azzerato al caricamento
  requiredPlayerLevel: number;   // livello giocatore minimo
  prerequisiteSkillIds: string[];// skill che devono essere già sbloccate
  pointCostPerLevel: number;     // punti spesi per ogni upgrade
  passiveModifiers?: IStatModifier[];
  type: 'PASSIVE' | 'ACTIVE';
}
```

## Caricare l'albero da JSON

```typescript
engine.skills.loadSkillTree([
  {
    id: 'forza_bruta',
    name: 'Forza Bruta',
    description: '+5 attacco per livello',
    maxLevel: 3,
    currentLevel: 0,
    requiredPlayerLevel: 1,
    prerequisiteSkillIds: [],
    pointCostPerLevel: 1,
    type: 'PASSIVE',
    passiveModifiers: [
      { id: 'fb', source: 'attack', type: ModifierType.FLAT, value: 5 },
    ],
  },
  {
    id: 'colpo_critico',
    name: 'Colpo Critico',
    description: 'Sbloccabile dopo Forza Bruta',
    maxLevel: 1,
    currentLevel: 0,
    requiredPlayerLevel: 5,
    prerequisiteSkillIds: ['forza_bruta'], // ← dipendenza nel DAG
    pointCostPerLevel: 2,
    type: 'ACTIVE',
  },
]);
```

`loadSkillTree` forza `currentLevel: 0` su ogni nodo: l'albero parte sempre "spento".

## Punti skill

I punti si ottengono salendo di livello (2 per livello, gestiti dal facade) oppure manualmente:

```typescript
engine.skills.addSkillPoints(5);
engine.skills.skillPoints; // number (sola lettura)
```

## Potenziare una skill

`upgradeSkill(skillId, playerLevel)` esegue **tutti i controlli** e ritorna un [`ISkillUnlockResult`](/api/interfacce#iskillunlockresult):

```typescript
const result = engine.skills.upgradeSkill('forza_bruta', engine.exp.currentLevel);

if (result.success) {
  // skill potenziata
} else {
  // result.reason spiega perché è fallita
}
```

### Le verifiche, in ordine

L'upgrade fallisce alla **prima** condizione non soddisfatta, con un `reason` esplicito:

| `reason` | Significato |
| --- | --- |
| `NOT_FOUND` | la skill non esiste nell'albero |
| `MAX_LEVEL` | la skill è già al livello massimo |
| `NO_POINTS` | punti skill insufficienti |
| `LOW_LEVEL` | il livello del giocatore è troppo basso |
| `MISSING_PREREQUISITES` | un prerequisito non è ancora sbloccato (`currentLevel === 0`) |

## Modificatori passivi: iniezione nelle statistiche

Quando potenzi una skill `PASSIVE` con `passiveModifiers`, lo `SkillManager` **inietta i modificatori nello `StatManager`**, scalandoli per il livello raggiunto e taggandoli con la skill come `source`:

```
valore iniettato = mod.value × currentLevel
source           = skill.id
id               = `${skill.id}_lvl_${currentLevel}`
```

Salendo di livello, il modificatore del livello precedente (taggato con la stessa `source`) viene **rimosso e sostituito**, evitando accumuli doppi. Ogni upgrade emette anche un evento `STAT_CHANGED`.

Questo è il punto in cui [skill](/guide/skill) e [statistiche](/guide/statistiche) si incontrano: l'albero è la causa, i modificatori per-sorgente sono l'effetto.

## Persistenza dell'albero

`exportState()` salva solo **punti non spesi** e **skill sbloccate** (`id → livello`). `importState()` ricostruisce lo stato e **ri-inietta** i modificatori passivi. Vedi [Persistenza](/guide/persistenza).

## Provalo

I nodi verdi sono al massimo, quelli evidenziati sono potenziabili, i grigi sono bloccati. Clicca un nodo bloccato per vedere il **`reason`** del fallimento. Potenzia `Forza` per sbloccare i prerequisiti di `Affondo`/`Furia`, e osserva l'**ATK** salire man mano che i modificatori passivi vengono iniettati nella statistica. `Maestria` richiede livello 5 e due prerequisiti.

<Demo name="skill-tree" title="Skill Tree — DAG, prerequisiti e modificatori passivi" :height="380" />
