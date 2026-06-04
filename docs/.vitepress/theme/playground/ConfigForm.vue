<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue';
import type { Playground } from './usePlayground';

const props = defineProps<{ pg: Playground }>();

type ModType = 'FLAT' | 'PERCENT';
interface FormStat { id: string; base: number }
interface FormMod { id: string; source: string; type: ModType; value: number }
interface FormSkill {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  requiredPlayerLevel: number;
  pointCostPerLevel: number;
  type: 'PASSIVE' | 'ACTIVE';
  prerequisiteSkillIds: string[];
  passiveModifiers: FormMod[];
}
interface FormXp {
  type: 'LINEAR' | 'EXPONENTIAL' | 'CUSTOM_TABLE';
  baseXP: number;
  multiplier: number;
  customTable: number[];
}

const model = reactive({
  stats: [] as FormStat[],
  xp: { type: 'EXPONENTIAL', baseXP: 100, multiplier: 1.5, customTable: [] } as FormXp,
  skills: [] as FormSkill[],
});
const formError = ref<string | null>(null);

let modCounter = 0;

function loadFromText() {
  try {
    const stats = JSON.parse(props.pg.statsText.value);
    const xp = JSON.parse(props.pg.xpText.value);
    const tree = JSON.parse(props.pg.treeText.value);

    model.stats = Object.entries(stats).map(([id, base]) => ({ id, base: Number(base) }));
    model.xp = {
      type: xp.type ?? 'EXPONENTIAL',
      baseXP: Number(xp.baseXP ?? 100),
      multiplier: Number(xp.multiplier ?? 1.5),
      customTable: Array.isArray(xp.customTable) ? xp.customTable.map(Number) : [],
    };
    model.skills = (Array.isArray(tree) ? tree : []).map((n: any) => ({
      id: n.id ?? '',
      name: n.name ?? '',
      description: n.description ?? '',
      maxLevel: Number(n.maxLevel ?? 1),
      requiredPlayerLevel: Number(n.requiredPlayerLevel ?? 1),
      pointCostPerLevel: Number(n.pointCostPerLevel ?? 1),
      type: n.type === 'ACTIVE' ? 'ACTIVE' : 'PASSIVE',
      prerequisiteSkillIds: Array.isArray(n.prerequisiteSkillIds) ? [...n.prerequisiteSkillIds] : [],
      passiveModifiers: Array.isArray(n.passiveModifiers)
        ? n.passiveModifiers.map((m: any) => ({
            id: m.id ?? `m_${modCounter++}`,
            source: m.source ?? '',
            type: m.type === 'PERCENT' ? 'PERCENT' : 'FLAT',
            value: Number(m.value ?? 0),
          }))
        : [],
    }));
    formError.value = null;
  } catch (e) {
    formError.value =
      'Current JSON is invalid — switch to JSON mode to fix it, or Reset to default. (' +
      (e instanceof Error ? e.message : String(e)) +
      ')';
  }
}

function syncToText() {
  const statsObj: Record<string, number> = {};
  for (const s of model.stats) if (s.id.trim()) statsObj[s.id.trim()] = Number(s.base) || 0;

  const xpObj: Record<string, unknown> = {
    type: model.xp.type,
    baseXP: Number(model.xp.baseXP) || 0,
    multiplier: Number(model.xp.multiplier) || 0,
  };
  if (model.xp.type === 'CUSTOM_TABLE') xpObj.customTable = model.xp.customTable.map((n) => Number(n) || 0);

  const tree = model.skills.map((s) => ({
    id: s.id.trim(),
    name: s.name,
    description: s.description,
    maxLevel: Number(s.maxLevel) || 1,
    currentLevel: 0,
    requiredPlayerLevel: Number(s.requiredPlayerLevel) || 1,
    prerequisiteSkillIds: [...s.prerequisiteSkillIds],
    pointCostPerLevel: Number(s.pointCostPerLevel) || 1,
    type: s.type,
    passiveModifiers: s.passiveModifiers.map((m) => ({
      id: m.id,
      source: m.source,
      type: m.type,
      value: Number(m.value) || 0,
    })),
  }));

  props.pg.statsText.value = JSON.stringify(statsObj, null, 2);
  props.pg.xpText.value = JSON.stringify(xpObj, null, 2);
  props.pg.treeText.value = JSON.stringify(tree, null, 2);
}

defineExpose({ syncToText, loadFromText });
onMounted(loadFromText);

// --- stats ---
function addStat() {
  model.stats.push({ id: 'new_stat', base: 0 });
}
function removeStat(i: number) {
  model.stats.splice(i, 1);
}

// --- xp ---
const customTableStr = computed({
  get: () => model.xp.customTable.join(', '),
  set: (v: string) =>
    (model.xp.customTable = v
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n))),
});

// --- skills ---
function addSkill() {
  model.skills.push({
    id: `skill_${model.skills.length + 1}`,
    name: 'New skill',
    description: '',
    maxLevel: 1,
    requiredPlayerLevel: 1,
    pointCostPerLevel: 1,
    type: 'PASSIVE',
    prerequisiteSkillIds: [],
    passiveModifiers: [],
  });
}
function removeSkill(i: number) {
  model.skills.splice(i, 1);
}
function addMod(skill: FormSkill) {
  skill.passiveModifiers.push({
    id: `m_${modCounter++}`,
    source: model.stats[0]?.id ?? 'attack',
    type: 'FLAT',
    value: 5,
  });
}
function removeMod(skill: FormSkill, i: number) {
  skill.passiveModifiers.splice(i, 1);
}
function togglePrereq(skill: FormSkill, id: string) {
  const idx = skill.prerequisiteSkillIds.indexOf(id);
  if (idx >= 0) skill.prerequisiteSkillIds.splice(idx, 1);
  else skill.prerequisiteSkillIds.push(id);
}

const otherSkillIds = (self: FormSkill) =>
  model.skills.filter((s) => s !== self && s.id.trim()).map((s) => s.id.trim());
</script>

<template>
  <div class="cf">
    <p v-if="formError" class="pg-error">{{ formError }}</p>

    <!-- STATS -->
    <div class="cf-section">
      <div class="cf-head">
        <span>Stats</span>
        <button class="pg-btn" @click="addStat">+ stat</button>
      </div>
      <div v-for="(s, i) in model.stats" :key="i" class="cf-row">
        <input class="pg-input" v-model="s.id" placeholder="id" style="flex: 2" />
        <input class="pg-input" type="number" v-model.number="s.base" placeholder="base" style="flex: 1" />
        <button class="cf-x" title="remove" @click="removeStat(i)">✕</button>
      </div>
      <p v-if="!model.stats.length" class="pg-muted cf-empty">No stats — add one.</p>
    </div>

    <!-- XP -->
    <div class="cf-section">
      <div class="cf-head"><span>XP curve</span></div>
      <div class="cf-row">
        <label class="cf-lbl">Type</label>
        <select class="pg-input" v-model="model.xp.type">
          <option value="LINEAR">LINEAR</option>
          <option value="EXPONENTIAL">EXPONENTIAL</option>
          <option value="CUSTOM_TABLE">CUSTOM_TABLE</option>
        </select>
      </div>
      <div class="cf-row" v-if="model.xp.type !== 'CUSTOM_TABLE'">
        <label class="cf-lbl">baseXP</label>
        <input class="pg-input" type="number" v-model.number="model.xp.baseXP" />
        <label class="cf-lbl" v-if="model.xp.type === 'EXPONENTIAL'">multiplier</label>
        <input
          v-if="model.xp.type === 'EXPONENTIAL'"
          class="pg-input"
          type="number"
          step="0.1"
          v-model.number="model.xp.multiplier"
        />
      </div>
      <div class="cf-row" v-else>
        <label class="cf-lbl">table</label>
        <input class="pg-input" v-model="customTableStr" placeholder="0, 0, 100, 250, 500" />
      </div>
      <p class="pg-muted cf-hint">
        <template v-if="model.xp.type === 'LINEAR'">req(L) = baseXP × (L − 1)</template>
        <template v-else-if="model.xp.type === 'EXPONENTIAL'"
          >req(L) = baseXP × (L − 1) ^ multiplier</template
        >
        <template v-else>req(L) = customTable[L] · index = level (1-based)</template>
      </p>
    </div>

    <!-- SKILLS -->
    <div class="cf-section">
      <div class="cf-head">
        <span>Skill tree</span>
        <button class="pg-btn" @click="addSkill">+ skill</button>
      </div>
      <p v-if="!model.skills.length" class="pg-muted cf-empty">No skills — add one.</p>

      <div v-for="(sk, i) in model.skills" :key="i" class="cf-card">
        <div class="cf-row">
          <input class="pg-input" v-model="sk.id" placeholder="id" style="flex: 1" />
          <input class="pg-input" v-model="sk.name" placeholder="name" style="flex: 2" />
          <button class="cf-x" title="remove skill" @click="removeSkill(i)">✕</button>
        </div>
        <input class="pg-input" v-model="sk.description" placeholder="description" />
        <div class="cf-grid4">
          <label class="cf-mini">max lvl<input class="pg-input" type="number" v-model.number="sk.maxLevel" /></label>
          <label class="cf-mini"
            >req lvl<input class="pg-input" type="number" v-model.number="sk.requiredPlayerLevel"
          /></label>
          <label class="cf-mini"
            >cost<input class="pg-input" type="number" v-model.number="sk.pointCostPerLevel"
          /></label>
          <label class="cf-mini"
            >type<select class="pg-input" v-model="sk.type">
              <option value="PASSIVE">PASSIVE</option>
              <option value="ACTIVE">ACTIVE</option>
            </select></label
          >
        </div>

        <div v-if="otherSkillIds(sk).length" class="cf-prereq">
          <span class="pg-muted">prerequisites:</span>
          <label v-for="pid in otherSkillIds(sk)" :key="pid" class="cf-chk">
            <input
              type="checkbox"
              :checked="sk.prerequisiteSkillIds.includes(pid)"
              @change="togglePrereq(sk, pid)"
            />
            {{ pid }}
          </label>
        </div>

        <div class="cf-mods">
          <div class="cf-head cf-head--sm">
            <span class="pg-muted">passive modifiers</span>
            <button class="pg-btn" @click="addMod(sk)">+ mod</button>
          </div>
          <div v-for="(m, mi) in sk.passiveModifiers" :key="mi" class="cf-row">
            <select class="pg-input" v-model="m.source" title="target stat">
              <option v-for="st in model.stats" :key="st.id" :value="st.id">{{ st.id }}</option>
            </select>
            <select class="pg-input" v-model="m.type" style="flex: 0 0 90px">
              <option value="FLAT">FLAT</option>
              <option value="PERCENT">PERCENT</option>
            </select>
            <input class="pg-input" type="number" step="0.05" v-model.number="m.value" style="flex: 0 0 80px" />
            <button class="cf-x" title="remove modifier" @click="removeMod(sk, mi)">✕</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cf {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.cf-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.cf-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.78rem;
  font-weight: 700;
}
.cf-head--sm {
  font-weight: 600;
}
.cf-row {
  display: flex;
  gap: 6px;
  align-items: center;
}
.cf-lbl {
  font-size: 0.74rem;
  color: var(--vp-c-text-3);
  min-width: 56px;
}
.cf-hint {
  font-size: 0.72rem;
  font-family: var(--vp-font-family-mono);
}
.cf-empty {
  font-size: 0.74rem;
}
.cf-x {
  border: none;
  background: transparent;
  color: var(--vp-c-text-3);
  cursor: pointer;
  font-size: 0.8rem;
  padding: 2px 6px;
  border-radius: 5px;
}
.cf-x:hover {
  color: var(--vp-c-danger-1, #b8272c);
  background: var(--vp-c-bg-soft);
}
.cf-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
}
.cf-grid4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}
.cf-mini {
  display: flex;
  flex-direction: column;
  font-size: 0.68rem;
  color: var(--vp-c-text-3);
  gap: 2px;
}
.cf-prereq {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  font-size: 0.74rem;
}
.cf-chk {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-family: var(--vp-font-family-mono);
  font-size: 0.72rem;
}
.cf-mods {
  display: flex;
  flex-direction: column;
  gap: 5px;
  border-top: 1px dashed var(--vp-c-divider);
  padding-top: 6px;
}
</style>
