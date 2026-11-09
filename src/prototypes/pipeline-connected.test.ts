/// <reference types="node" />
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import test from 'node:test'
import { changePhaseDuration, defaultSelection, moveSelection } from './pipeline-scheduling.ts'
import type { OverlapRule, Plan } from './pipeline-scheduling.ts'
import type { BaselineActionSource, BaselineState, PipelineVersion } from './pipeline-versions.ts'
import type { PipelineSource, PipelineSaveMode, PipelineOpenResolution } from './pipeline-connected-types.ts'

const source = readFileSync(new URL('../../mockups/demo-data.js', import.meta.url), 'utf8')
interface Demo {
  plans(): Plan[]
  library(): { sharedRules: OverlapRule[]; types: { id: string; color: string }[] }
  saveLibrary(library: { sharedRules: OverlapRule[] }): void
  addPlan(plan: Plan): Plan
  updatePlan(id: string, plan: Plan, expected?: Plan): Plan
  updatePlans(changed: Plan[], expected: Plan[], rules: OverlapRule[], reason?: string): Plan[]
  pipelineSource(): PipelineSource
  savePipeline(input: { name: string; note: string }, expected: PipelineSource, mode: PipelineSaveMode): PipelineVersion
  openPipeline(target: PipelineVersion, expected: PipelineSource, resolution?: PipelineOpenResolution): PipelineVersion
  editBaseline(target: PipelineVersion, expected: PipelineSource, resolution?: PipelineOpenResolution): PipelineVersion
  viewLivePipeline(expected: PipelineSource, resolution?: PipelineOpenResolution): PipelineSource
  preparePipelineEntry(resume?: boolean): PipelineSource
  discardPipelineChanges(expected: PipelineSource): PipelineSource
  savedVersions(): PipelineVersion[]
  versionRecords(): { versions: PipelineVersion[]; baseline: BaselineState }
  baselineState(): BaselineState
  baselineActionSource(id: string): BaselineActionSource
  confirmBaseline(id: string, rationale: string | undefined, expected: BaselineActionSource): PipelineVersion
}
function setup(initialStored: string | null = null, editing = false) {
  let stored = initialStored, writes = 0, fail = false
  const browser = { location: { protocol: 'http:' }, LTPPDemo: undefined as Demo | undefined }
  runInNewContext(source, {
    window: browser, crypto: globalThis.crypto,
    localStorage: { getItem: () => stored, setItem: (_key: string, value: string) => {
      if (fail) throw new Error('Storage full')
      stored = value; writes++
    } },
  })
  if (editing) { const demo = browser.LTPPDemo!; demo.editBaseline(demo.pipelineSource().record!, demo.pipelineSource()); writes = 0 }
  return { demo: browser.LTPPDemo!, get raw() { return stored }, get writes() { return writes }, fail: () => { fail = true }, replaceRaw: (raw: string | null) => { stored = raw } }
}
const plain = <T,>(value: T): T => JSON.parse(JSON.stringify(value))
const saved = (demo: Demo, id: string) => demo.savedVersions().find(item => item.id === id)!
const saveNamed = (demo: Demo, name: string) => demo.savePipeline({ name, note: 'Keep this planning option.' }, demo.pipelineSource(), 'saveAs')
const confirm = (demo: Demo, id: string, rationale?: string) => demo.confirmBaseline(id, rationale, demo.baselineActionSource(id))
const schedules = (plans: Plan[]) => plans.map(({ approvedBaseline: _reference, ...plan }) => plan)

test('reviewed changes to multiple procurements save together and preserve baselines and Library data', () => {
  const browser = setup(null, true), demo = browser.demo, before = demo.plans(), library = demo.library()
  let after = moveSelection(before, defaultSelection(before[0]), -8)
  after = moveSelection(after, defaultSelection(before[1]), -16)
  demo.updatePlans(after.slice(0, 2), before, library.sharedRules)
  assert.equal(browser.writes, 1)
  const saved = demo.plans()
  assert.deepEqual(JSON.parse(JSON.stringify(saved)), after)
  assert.deepEqual(demo.library(), library)
  assert.equal(JSON.parse(browser.raw!).adjustmentHistory[0].changes.length, 2)
})

test('validation or storage failures leave the entire saved pipeline untouched', () => {
  const browser = setup(null, true), demo = browser.demo, before = demo.plans(), rules = demo.library().sharedRules
  const invalid = moveSelection(before, defaultSelection(before[0]), -8)
  invalid[1].phases[0].weeks = 0
  assert.throws(() => demo.updatePlans(invalid, before, rules), /Check each phase/)
  assert.equal(browser.writes, 0)
  assert.deepEqual(demo.plans(), before)
  browser.fail()
  const valid = moveSelection(before, defaultSelection(before[0]), -8)
  assert.throws(() => demo.updatePlans([valid[0]], before, rules), /could not be saved/)
  assert.equal(browser.writes, 0)
  assert.deepEqual(demo.plans(), before)
})

test('a pipeline changed in another page cannot be overwritten by an old preview', () => {
  const browser = setup(null, true), demo = browser.demo, before = demo.plans(), rules = demo.library().sharedRules
  demo.updatePlan(before[0].id, { ...before[0], name: 'Updated in another page' })
  const saved = browser.raw
  const changed = moveSelection(before, defaultSelection(before[0]), -8)
  assert.throws(() => demo.updatePlans([changed[0]], before, rules), /another page/)
  assert.equal(browser.raw, saved)
})

test('remaining critical clashes require a recorded reason', () => {
  const browser = setup(null, true), demo = browser.demo, before = demo.plans(), rules = demo.library().sharedRules
  const after = changePhaseDuration(before, { planId: before[0].id, first: 8, last: 8 }, 18, 'start')
  assert.throws(() => demo.updatePlans([after[0]], before, rules), /Record a reason/)
  assert.equal(browser.writes, 0)
  demo.updatePlans([after[0]], before, rules, 'Accepted for the fictional planning exercise.')
  assert.equal(JSON.parse(browser.raw!).adjustmentHistory[0].reason, 'Accepted for the fictional planning exercise.')
})

test('overlap rules changed after the preview cannot be silently ignored', () => {
  const browser = setup(null, true), demo = browser.demo, before = demo.plans(), rules = demo.library().sharedRules
  const latest = demo.library()
  latest.sharedRules = []
  demo.saveLibrary(latest)
  const saved = browser.raw
  const after = moveSelection(before, defaultSelection(before[0]), -8)
  assert.throws(() => demo.updatePlans([after[0]], before, rules), /overlap rules changed/)
  assert.equal(browser.raw, saved)
})

test('new procurement metadata and a null approved baseline survive an adjustment', () => {
  const browser = setup(null, true), demo = browser.demo, input = demo.plans()[0]
  const added = demo.addPlan({ ...input, name: 'New procurement', approvedBaseline: null })
  const before = demo.plans(), rules = demo.library().sharedRules
  const after = moveSelection(before, defaultSelection(added), -8)
  const changed = after.find(plan => plan.id === added.id)!
  demo.updatePlans([changed], before, rules, 'Fictional exercise.')
  const saved = demo.plans().find(plan => plan.id === added.id)!
  assert.equal(saved.approvedBaseline, null)
  assert.deepEqual(JSON.parse(JSON.stringify(saved.phases)), changed.phases)
})


test('the clean prototype has one live baseline, a previous baseline and editable alternatives', () => {
  const { demo } = setup(), records = demo.versionRecords()
  assert.equal(records.versions.filter(item => item.status === 'current').length, 1)
  assert.equal(records.versions.filter(item => item.status === 'previous').length, 1)
  assert.equal(records.versions.filter(item => item.status === 'saved').length, 2)
  assert.equal(records.baseline.currentId, 'v02')
  assert.equal(demo.pipelineSource().record!.id, 'v02')
  assert.equal(demo.pipelineSource().dirty, false)
  assert.ok(records.baseline.events.every(event => event.type === 'confirmed'))
  assert.equal('proposeBaseline' in demo, false)
  assert.equal('approveBaseline' in demo, false)
  assert.equal('createBaselineProposal' in demo, false)
})

test('the authorised reset replaces old mockup data without a migration journey', () => {
  for (const version of [1, 2]) {
    const browser = setup()
    saveNamed(browser.demo, 'Old mockup pipeline')
    const old = JSON.parse(browser.raw!); old.version = version
    const reset = setup(JSON.stringify(old))
    assert.equal(reset.writes, 1)
    assert.equal(reset.demo.savedVersions().length, 4)
    assert.equal(reset.demo.savedVersions().some(item => item.name === 'Old mockup pipeline'), false)
    assert.equal(reset.demo.pipelineSource().context.id, 'v02')
    assert.equal(JSON.parse(reset.raw!).version, 3)
  }
})

test('saving requires a name and reason, records the editor, and starts a named editing context', () => {
  const browser = setup(), demo = browser.demo, source = demo.pipelineSource()
  for (const input of [{ name: '', note: 'Why' }, { name: 'A name', note: ' ' }, { name: 'x'.repeat(121), note: 'Why' }])
    assert.throws(() => demo.savePipeline(input, source, 'saveAs'), /Enter|120 characters/)
  assert.equal(browser.writes, 0)
  const version = demo.savePipeline({ name: '  Planning option  ', note: '  Retain these dates.  ' }, source, 'saveAs')
  assert.equal(version.name, 'Planning option')
  assert.equal(version.note, 'Retain these dates.')
  assert.equal(version.number, 5)
  assert.equal(version.revision, 1)
  assert.equal(version.savedBy, 'Alex Morgan')
  assert.equal(version.savedById, 'demo-editor-alex')
  assert.ok(Number.isFinite(Date.parse(version.savedAt)))
  assert.equal(version.confirmation, undefined)
  assert.equal(demo.pipelineSource().context.id, version.id)
  assert.equal(demo.pipelineSource().dirty, false)
})

test('named edits remain separate until overwrite and survive reloads', () => {
  const browser = setup(), demo = browser.demo, first = saveNamed(demo, 'Stagger evaluations')
  demo.updatePlan(first.plans[0].id, { ...first.plans[0], anchor: first.plans[0].anchor + 86400000 })
  assert.equal(demo.pipelineSource().dirty, true)
  assert.deepEqual(saved(demo, first.id), first)
  const update = demo.savePipeline({ name: first.name, note: 'Update the actual anchor date.' }, demo.pipelineSource(), 'save')
  assert.equal(update.id, first.id); assert.equal(update.revision, 2)
  assert.equal(demo.savedVersions().length, 5)
  assert.equal(demo.pipelineSource().dirty, false)
  const reopened = setup(browser.raw).demo.pipelineSource()
  assert.equal(reopened.record!.name, first.name)
  assert.equal(reopened.plans[0].anchor, first.plans[0].anchor + 86400000)
  assert.equal(reopened.dirty, false)
})

test('Save as requires a distinct available name and preserves the original', () => {
  const { demo } = setup(), first = saveNamed(demo, 'First option')
  for (const name of ['First option', ' FIRST OPTION ', ' autumn PIPELINE '])
    assert.throws(() => saveNamed(demo, name), /different name|already exists/)
  const second = saveNamed(demo, 'Second option')
  assert.notEqual(first.id, second.id)
  assert.equal(demo.pipelineSource().context.id, second.id)
  assert.deepEqual(saved(demo, first.id), first)
})

test('saved schedules, rules, colours and reasons survive later working edits and Library changes', () => {
  const browser = setup(), demo = browser.demo, record = saveNamed(demo, 'Original values')
  const moved = moveSelection(demo.plans(), defaultSelection(demo.plans()[0]), -8)
  demo.updatePlan(moved[0].id, moved[0])
  const library = demo.library(); library.types[0].color = '#112233'; library.sharedRules = []
  demo.saveLibrary(library)
  const reloaded = setup(browser.raw).demo
  assert.deepEqual(plain(saved(reloaded, record.id)), plain(record))
  assert.notDeepEqual(reloaded.plans()[0].phases, record.plans[0].phases)
  assert.equal(reloaded.pipelineSource().dirty, true)
})

test('opening replaces added and removed procurements without replacing Library or history', () => {
  const browser = setup(null, true), demo = browser.demo
  const added = demo.addPlan({ ...demo.plans()[0], name: 'Additional procurement', approvedBaseline: null })
  const target = saveNamed(demo, 'Reduced option')
  saveNamed(demo, 'Other option')
  const raw = JSON.parse(browser.raw!)
  raw.savedVersions.find((item: PipelineVersion) => item.id === target.id).plans = [raw.plans.find((plan: Plan) => plan.id === added.id)]
  browser.replaceRaw(JSON.stringify(raw))
  const records = plain(demo.savedVersions()), library = plain(demo.library()), baseline = plain(demo.baselineState())
  demo.openPipeline(saved(demo, target.id), demo.pipelineSource())
  assert.equal(demo.plans().length, 1)
  assert.equal(demo.plans()[0].id, added.id)
  assert.equal(demo.plans()[0].approvedBaseline, null)
  assert.deepEqual(plain(demo.savedVersions()), records)
  assert.deepEqual(plain(demo.library()), library)
  assert.deepEqual(plain(demo.baselineState()), baseline)
})

test('editing uses current Library colours and rules while retaining saved dates', () => {
  const { demo } = setup(null, true), target = saved(demo, 'v03')
  const library = demo.library(); library.types[0].color = '#112233'; library.sharedRules = []
  demo.saveLibrary(library)
  demo.openPipeline(target, demo.pipelineSource(), { action: 'discard' })
  assert.equal(demo.plans()[0].phases[0].color, '#112233')
  assert.equal(demo.plans()[0].phases[0].s, target.plans[0].phases[0].s)
  assert.equal(demo.plans()[0].phases[0].weeks, target.plans[0].phases[0].weeks)
  assert.equal(demo.pipelineSource().rules.length, 0)
  assert.deepEqual(saved(demo, target.id), target)
})

test('switching requires a choice when dirty and discard preserves the saved record', () => {
  const browser = setup(), demo = browser.demo, current = saveNamed(demo, 'Current edits'), target = saved(demo, 'v03')
  demo.updatePlan(current.plans[0].id, { ...current.plans[0], name: 'Pending edit' })
  const source = demo.pipelineSource(), before = browser.raw
  assert.throws(() => demo.openPipeline(target, source), /Save or discard/)
  assert.equal(browser.raw, before)
  demo.openPipeline(target, source, { action: 'discard' })
  assert.deepEqual(saved(demo, current.id), current)
  assert.equal(demo.pipelineSource().record!.id, target.id)
  assert.equal(demo.pipelineSource().dirty, false)
})

test('save and open commits overwrite or Save as together in one write', () => {
  for (const mode of ['save', 'saveAs'] as const) {
    const browser = setup(), demo = browser.demo, first = saveNamed(demo, 'First option'), target = saved(demo, 'v03')
    demo.updatePlan(first.plans[0].id, { ...first.plans[0], name: 'Saved before switching' })
    const writes = browser.writes
    demo.openPipeline(target, demo.pipelineSource(), { action: 'save', mode, input: { name: mode === 'save' ? first.name : 'Another option', note: 'Keep before switching.' } })
    assert.equal(browser.writes, writes + 1)
    assert.equal(demo.pipelineSource().context.id, target.id)
    const retained = demo.savedVersions().find(item => item.name === (mode === 'save' ? first.name : 'Another option'))!
    assert.equal(retained.plans[0].name, 'Saved before switching')
    if (mode === 'saveAs') assert.deepEqual(saved(demo, first.id), first)
  }
})

test('failed save and switching writes preserve every record and the pending context', () => {
  for (const action of ['save', 'saveAs', 'discard', 'saveAndOpen']) {
    const browser = setup(), demo = browser.demo, first = saveNamed(demo, 'Pending option')
    demo.updatePlan(first.plans[0].id, { ...first.plans[0], name: 'Important pending changes' })
    const source = demo.pipelineSource(), raw = browser.raw, target = saved(demo, 'v03')
    browser.fail()
    assert.throws(() => {
      if (action === 'save' || action === 'saveAs') demo.savePipeline({ name: action === 'save' ? first.name : 'New option', note: 'Keep these edits.' }, source, action)
      else demo.openPipeline(target, source, action === 'discard' ? { action: 'discard' } : { action: 'save', mode: 'saveAs', input: { name: 'New option', note: 'Keep these edits.' } })
    }, /could not be saved/)
    assert.equal(browser.raw, raw)
    assert.deepEqual(demo.pipelineSource(), source)
  }
})

test('stale pages cannot apply edits to a different open pipeline, even with identical schedules', () => {
  const browser = setup(), demo = browser.demo, first = saveNamed(demo, 'First option')
  saveNamed(demo, 'Second option')
  const older = setup(browser.raw), before = older.demo.pipelineSource()
  demo.openPipeline(first, demo.pipelineSource()); older.replaceRaw(browser.raw)
  for (const action of [
    () => older.demo.updatePlan(before.plans[0].id, { ...before.plans[0], name: 'Wrong context' }),
    () => older.demo.addPlan(before.plans[0]),
    () => older.demo.updatePlans(before.plans, before.plans, before.rules),
    () => older.demo.savePipeline({ name: before.record!.name, note: 'Outdated save' }, before, 'save'),
  ]) assert.throws(action, /Another pipeline was opened/)
  assert.equal(older.raw, browser.raw)
})

test('changed source data or an opening target cannot be used by an old dialog', () => {
  const browser = setup(), demo = browser.demo
  saveNamed(demo, 'Current option')
  const source = demo.pipelineSource(), target = saved(demo, 'v03'), raw = JSON.parse(browser.raw!)
  raw.savedVersions.find((item: PipelineVersion) => item.id === target.id).name = 'Changed elsewhere'
  browser.replaceRaw(JSON.stringify(raw))
  assert.throws(() => demo.openPipeline(target, source), /selected pipeline changed/)
  demo.updatePlan(source.plans[0].id, { ...source.plans[0], name: 'Updated elsewhere' })
  const retained = browser.raw
  assert.throws(() => demo.savePipeline({ name: source.record!.name, note: 'Outdated save' }, source, 'save'), /changed in another page/)
  assert.equal(browser.raw, retained)
})

test('current and previous baselines stay fixed and editing requires a new name across reloads', () => {
  for (const id of ['v01', 'v02']) {
    const browser = setup(), demo = browser.demo, baseline = saved(demo, id), records = plain(demo.savedVersions()), history = plain(demo.baselineState())
    assert.throws(() => demo.openPipeline(baseline, demo.pipelineSource()), /baseline is fixed/)
    demo.editBaseline(baseline, demo.pipelineSource())
    const reopened = setup(browser.raw).demo, source = reopened.pipelineSource()
    assert.equal(source.record, null); assert.equal(source.dirty, false)
    assert.equal(source.context.originBaseline!.name, baseline.name)
    assert.throws(() => reopened.savePipeline({ name: baseline.name, note: 'Keep changes.' }, source, 'save'), /baseline cannot be overwritten/)
    assert.throws(() => saveNamed(reopened, baseline.name.toUpperCase()), /different name/)
    const copy = saveNamed(reopened, 'New planning option')
    assert.equal(copy.status, 'saved'); assert.equal(copy.confirmation, undefined)
    assert.equal(reopened.pipelineSource().context.originBaseline, undefined)
    assert.deepEqual(plain(reopened.savedVersions().slice(0, 4)), records)
    assert.deepEqual(plain(reopened.baselineState()), history)
  }
})

test('baseline editing tracks actual-anchor edits and can be left without changes', () => {
  const { demo } = setup()
  demo.editBaseline(saved(demo, 'v02'), demo.pipelineSource())
  const original = demo.plans()[0]
  demo.updatePlan(original.id, { ...original, anchor: original.anchor + 86400000 })
  assert.equal(demo.pipelineSource().dirty, true)
  demo.updatePlan(original.id, original)
  assert.equal(demo.pipelineSource().dirty, false)
  demo.openPipeline(saved(demo, 'v03'), demo.pipelineSource())
  assert.equal(demo.pipelineSource().record!.id, 'v03')
})

test('editing an older baseline preserves the current reference and all fixed records', () => {
  const { demo } = setup(), current = confirm(demo, 'v03'), old = saved(demo, 'v02')
  const records = plain(demo.savedVersions()), history = plain(demo.baselineState())
  demo.editBaseline(old, demo.pipelineSource())
  assert.equal(demo.plans()[0].anchor, old.plans[0].anchor)
  assert.equal(demo.plans()[0].approvedBaseline!.anchor, current.plans[0].anchor)
  demo.updatePlan(old.plans[0].id, { ...demo.plans()[0], name: 'Developed plan' })
  const copy = saveNamed(demo, 'Developed pipeline')
  assert.equal(copy.confirmation, undefined)
  assert.deepEqual(plain(demo.savedVersions().slice(0, 4)), records)
  assert.deepEqual(plain(demo.baselineState()), history)
})

test('saving before baseline editing is atomic and preserves the old candidate', () => {
  const browser = setup(), demo = browser.demo, first = saveNamed(demo, 'Pending option')
  demo.updatePlan(first.plans[0].id, { ...first.plans[0], name: 'Pending change' })
  const writes = browser.writes
  demo.editBaseline(saved(demo, 'v01'), demo.pipelineSource(), { action: 'save', mode: 'saveAs', input: { name: 'Retained option', note: 'Keep changes.' } })
  assert.equal(browser.writes, writes + 1)
  assert.deepEqual(saved(demo, first.id), first)
  assert.equal(demo.savedVersions().find(item => item.name === 'Retained option')!.plans[0].name, 'Pending change')
  assert.equal(demo.pipelineSource().context.originBaseline!.id, 'v01')
})

test('failed baseline loading or first saving preserves origin, edits and every record', () => {
  for (const action of ['load', 'saveAndLoad', 'firstSave']) {
    const browser = setup(), demo = browser.demo
    const first = saveNamed(demo, 'Pending option'), baseline = saved(demo, 'v02')
    if (action === 'firstSave') demo.editBaseline(baseline, demo.pipelineSource())
    else demo.updatePlan(first.plans[0].id, { ...first.plans[0], name: 'Pending changes' })
    const source = demo.pipelineSource(), raw = browser.raw
    browser.fail()
    assert.throws(() => {
      if (action === 'firstSave') saveNamed(demo, 'New named pipeline')
      else demo.editBaseline(baseline, source, action === 'load' ? { action: 'discard' } : { action: 'save', mode: 'saveAs', input: { name: 'New named pipeline', note: 'Keep changes.' } })
    }, /could not be saved/)
    assert.equal(browser.raw, raw); assert.deepEqual(demo.pipelineSource(), source)
  }
})

test('baseline confirmation accepts no rationale and records who and when automatically', () => {
  for (const rationale of [undefined, '', '   ', '  Revised delivery sequence.  ']) {
    const browser = setup(), demo = browser.demo, source = demo.baselineActionSource('v03'), previous = plain(source.baseline), before = Date.now()
    const result = demo.confirmBaseline('v03', rationale, source)
    assert.equal(browser.writes, 1)
    assert.equal(result.status, 'current')
    assert.equal(result.id, source.version.id)
    assert.deepEqual(plain(result.plans), plain(source.version.plans))
    assert.deepEqual(plain(result.rules), plain(source.version.rules))
    assert.equal(result.confirmation!.by, 'Alex Morgan')
    assert.equal(result.confirmation!.byId, 'demo-editor-alex')
    assert.equal(result.confirmation!.fromBaselineId, previous.id)
    assert.ok(Date.parse(result.confirmation!.at) >= before)
    assert.equal(result.confirmation!.rationale, rationale?.trim() || undefined)
    assert.equal(demo.baselineState().currentId, result.id)
    assert.equal(demo.savedVersions().filter(item => item.status === 'current').length, 1)
    assert.equal(demo.savedVersions().length, 4)
    assert.deepEqual(plain(saved(demo, previous.id)), { ...previous, status: 'previous' })
    assert.equal(demo.baselineState().events.at(-1)!.type, 'confirmed')
    assert.equal(demo.baselineState().events.at(-1)!.rationale, rationale?.trim() || undefined)
  }
})

test('confirmation keeps all other saved alternatives and previous baseline history', () => {
  const { demo } = setup(), initial = plain(demo.savedVersions()), history = plain(demo.baselineState())
  const first = confirm(demo, 'v03', 'Later transfer.')
  const second = confirm(demo, 'v04')
  assert.deepEqual(plain(saved(demo, 'v01')), initial.find(item => item.id === 'v01'))
  assert.deepEqual(plain(saved(demo, first.id)), { ...plain(first), status: 'previous' })
  assert.equal(second.confirmation!.fromBaselineId, first.id)
  assert.deepEqual(plain(demo.baselineState().events.slice(0, 2)), history.events)
  assert.equal(demo.baselineState().events.length, 4)
})

test('review always uses the current baseline even if the selected saved pipeline is older', () => {
  const { demo } = setup()
  const newer = saveNamed(demo, 'Newest baseline')
  confirm(demo, newer.id)
  const source = demo.baselineActionSource('v03')
  assert.ok(Date.parse(source.version.savedAt) < Date.parse(source.baseline.savedAt))
  assert.equal(source.baseline.id, newer.id)
  const result = demo.confirmBaseline('v03', undefined, source)
  assert.equal(result.confirmation!.fromBaselineId, newer.id)
})

test('only a saved editable pipeline can become a new baseline', () => {
  const browser = setup(), demo = browser.demo
  for (const id of ['v01', 'v02', 'missing']) assert.throws(() => demo.baselineActionSource(id), /editable saved|no longer available/)
  assert.equal(browser.writes, 0)
  const source = demo.baselineActionSource('v03')
  assert.throws(() => demo.confirmBaseline('missing', '', source), /changed during review/)
  assert.equal(browser.writes, 0)
})

test('unsaved changes must be resolved before any saved pipeline is confirmed', () => {
  const browser = setup(), demo = browser.demo, named = saveNamed(demo, 'Working changes')
  demo.updatePlan(named.plans[0].id, { ...named.plans[0], name: 'Pending edits' })
  const source = demo.baselineActionSource('v03'), raw = browser.raw
  assert.throws(() => demo.confirmBaseline('v03', '', source), /Save or discard/)
  assert.equal(browser.raw, raw)
  demo.discardPipelineChanges(source.working)
  assert.deepEqual(saved(demo, named.id), named)
  assert.equal(demo.pipelineSource().dirty, false)
  assert.equal(confirm(demo, 'v03').status, 'current')
})

test('discard before review handles an unnamed baseline edit and preserves fixed baselines', () => {
  const { demo } = setup(), baseline = saved(demo, 'v02')
  demo.editBaseline(baseline, demo.pipelineSource())
  demo.updatePlan(demo.plans()[0].id, { ...demo.plans()[0], name: 'Pending baseline edit' })
  demo.discardPipelineChanges(demo.pipelineSource())
  assert.equal(demo.pipelineSource().context.originBaseline!.id, baseline.id)
  assert.equal(demo.pipelineSource().dirty, false)
  assert.deepEqual(saved(demo, baseline.id), baseline)
})

test('confirming another pipeline preserves the open schedule, its additions, and the live Library', () => {
  const { demo } = setup(null, true), target = saved(demo, 'v03')
  const extra = demo.addPlan({ ...demo.plans()[0], name: 'An additional procurement', approvedBaseline: null })
  const opened = saveNamed(demo, 'Another editable pipeline'), before = plain(demo.plans()), library = plain(demo.library())
  const result = confirm(demo, target.id)
  assert.equal(result.id, target.id)
  assert.equal(demo.pipelineSource().record!.id, opened.id)
  assert.deepEqual(plain(schedules(demo.plans())), schedules(before))
  assert.deepEqual(plain(demo.library()), library)
  assert.equal(demo.plans().find(plan => plan.id === extra.id)!.approvedBaseline, null)
  assert.equal(demo.plans()[0].approvedBaseline!.anchor, target.plans[0].anchor)
  assert.equal(demo.pipelineSource().dirty, false)
})

test('changed candidate contents invalidate a confirmation review', () => {
  const browser = setup(), demo = browser.demo
  saveNamed(demo, 'Unrelated option')
  const source = demo.baselineActionSource('v03'), state = JSON.parse(browser.raw!)
  state.savedVersions.find((item: PipelineVersion) => item.id === 'v03').name = 'Edited candidate'
  browser.replaceRaw(JSON.stringify(state))
  const retained = browser.raw
  assert.throws(() => demo.confirmBaseline('v03', '', source), /changed during review/)
  assert.equal(browser.raw, retained)
})

test('a changed current baseline invalidates an earlier review', () => {
  const browser = setup(), demo = browser.demo, review = demo.baselineActionSource('v03')
  const other = setup(browser.raw); confirm(other.demo, 'v04')
  browser.replaceRaw(other.raw)
  const retained = browser.raw
  assert.throws(() => demo.confirmBaseline('v03', '', review), /changed in another page|changed during review/)
  assert.equal(browser.raw, retained)
})

test('working edits or Library changes during review cannot be silently captured', () => {
  for (const change of ['plan', 'rules']) {
    const browser = setup(null, true), demo = browser.demo, review = demo.baselineActionSource('v03')
    if (change === 'plan') demo.updatePlan(demo.plans()[0].id, { ...demo.plans()[0], anchor: demo.plans()[0].anchor + 86400000 })
    else { const library = demo.library(); library.sharedRules = []; demo.saveLibrary(library) }
    const retained = browser.raw
    assert.throws(() => demo.confirmBaseline('v03', '', review), /changed in another page/)
    assert.equal(browser.raw, retained)
  }
})

test('invalid rationale is rejected before any write, while critical findings do not make it mandatory', () => {
  const browser = setup(), demo = browser.demo, review = demo.baselineActionSource('v03')
  assert.throws(() => demo.confirmBaseline('v03', 'x'.repeat(2001), review), /2,000 characters/)
  assert.throws(() => demo.confirmBaseline('v03', 42 as unknown as string, review), /optional rationale/)
  assert.equal(browser.writes, 0)
  assert.equal(demo.confirmBaseline('v03', '', review).status, 'current')
})

test('failed confirmation writes leave statuses, schedules, history and inputs unchanged', () => {
  const browser = setup(), demo = browser.demo
  saveNamed(demo, 'Retained option')
  const review = demo.baselineActionSource('v03'), raw = browser.raw, records = plain(demo.versionRecords()), working = plain(demo.pipelineSource())
  browser.fail()
  assert.throws(() => demo.confirmBaseline('v03', 'Rationale to retain.', review), /could not be saved/)
  assert.equal(browser.raw, raw)
  assert.deepEqual(plain(demo.versionRecords()), records)
  assert.deepEqual(plain(demo.pipelineSource()), working)
})

test('invalid saved schedules cannot be fixed as a baseline or partially change its history', () => {
  for (const invalid of ['empty', 'duplicate', 'duration']) {
    const browser = setup(), demo = browser.demo
    saveNamed(demo, 'Unrelated working option')
    const raw = JSON.parse(browser.raw!), target = raw.savedVersions.find((item: PipelineVersion) => item.id === 'v03')
    if (invalid === 'empty') target.plans = []
    else if (invalid === 'duplicate') target.plans.push(target.plans[0])
    else target.plans[0].phases[0].weeks = 0
    browser.replaceRaw(JSON.stringify(raw))
    const review = demo.baselineActionSource('v03'), retained = browser.raw
    assert.throws(() => demo.confirmBaseline('v03', '', review), /Add a procurement|appears more than once|Check each phase/)
    assert.equal(browser.raw, retained)
    assert.equal(demo.baselineState().currentId, 'v02')
  }
})

test('repeat confirmation cannot add a duplicate event or alter a fixed baseline', () => {
  const browser = setup(), demo = browser.demo, review = demo.baselineActionSource('v03')
  const baseline = demo.confirmBaseline('v03', '', review), retained = browser.raw
  assert.throws(() => demo.confirmBaseline('v03', '', review), /changed in another page|changed during review/)
  assert.throws(() => demo.baselineActionSource(baseline.id), /editable saved/)
  assert.equal(browser.raw, retained)
})

test('a pipeline made into a baseline during editing requires Save as with a new name', () => {
  const browser = setup(), demo = browser.demo, named = saveNamed(demo, 'Planning option')
  const source = demo.pipelineSource(), other = setup(browser.raw)
  confirm(other.demo, named.id)
  browser.replaceRaw(other.raw)
  assert.throws(() => demo.savePipeline({ name: named.name, note: 'Old dialog' }, source, 'save'), /changed in another page/)
  const latest = demo.pipelineSource()
  assert.throws(() => demo.savePipeline({ name: named.name, note: 'Overwrite' }, latest, 'save'), /baseline cannot be overwritten/)
  assert.throws(() => saveNamed(demo, named.name), /different name/)
  const copy = saveNamed(demo, 'Further planning')
  assert.equal(copy.status, 'saved')
  assert.equal(copy.confirmation, undefined)
  assert.equal(saved(demo, named.id).status, 'current')
})

test('failed discard before review retains the editing context and pending changes', () => {
  const browser = setup(), demo = browser.demo
  saveNamed(demo, 'Working option')
  demo.updatePlan(demo.plans()[0].id, { ...demo.plans()[0], name: 'Important edit' })
  const source = demo.pipelineSource(), retained = browser.raw
  browser.fail()
  assert.throws(() => demo.discardPipelineChanges(source), /could not be saved/)
  assert.equal(browser.raw, retained)
  assert.deepEqual(demo.pipelineSource(), source)
})

test('the live baseline is read-only and cannot be changed through procurement or adjustment APIs', () => {
  const browser = setup(), demo = browser.demo, source = demo.pipelineSource()
  assert.equal(source.isLive, true); assert.equal(source.readOnly, true)
  const plans = source.plans, baseline = saved(demo, 'v02')
  assert.throws(() => demo.addPlan(plans[0]), /Choose Edit this pipeline/)
  assert.throws(() => demo.updatePlan(plans[0].id, { ...plans[0], name: 'Changed' }), /Choose Edit this pipeline/)
  assert.throws(() => demo.updatePlans(plans, plans, source.rules), /Choose Edit this pipeline/)
  assert.equal(browser.writes, 0)
  assert.deepEqual(saved(demo, baseline.id), baseline)
})

test('first entry defaults to live while an explicit resume retains the selected pipeline', () => {
  const { demo } = setup(), alternative = saved(demo, 'v03')
  demo.openPipeline(alternative, demo.pipelineSource())
  assert.equal(demo.preparePipelineEntry(true).context.id, alternative.id)
  const initial = demo.preparePipelineEntry()
  assert.equal(initial.context.id, 'v02'); assert.equal(initial.isLive, true)
  assert.equal(initial.readOnly, true)
  assert.deepEqual(saved(demo, alternative.id), alternative)
})

test('first entry retains unsaved work instead of replacing it with the live pipeline', () => {
  const browser = setup(), demo = browser.demo
  demo.editBaseline(saved(demo, 'v02'), demo.pipelineSource())
  demo.updatePlan(demo.plans()[0].id, { ...demo.plans()[0], name: 'Unsaved baseline development' })
  const source = demo.pipelineSource(), raw = browser.raw, writes = browser.writes
  assert.deepEqual(demo.preparePipelineEntry(), source)
  assert.equal(browser.raw, raw); assert.equal(browser.writes, writes)
  assert.equal(demo.pipelineSource().isLive, false)
})

test('returning to live requires a choice and discard preserves every saved pipeline', () => {
  const browser = setup(), demo = browser.demo, alternative = saveNamed(demo, 'Alternative')
  demo.updatePlan(alternative.plans[0].id, { ...alternative.plans[0], name: 'Pending change' })
  const records = plain(demo.savedVersions()), source = demo.pipelineSource(), raw = browser.raw
  assert.throws(() => demo.viewLivePipeline(source), /Save or discard/)
  assert.equal(browser.raw, raw)
  const live = demo.viewLivePipeline(source, { action: 'discard' })
  assert.equal(live.isLive, true); assert.equal(live.readOnly, true); assert.equal(live.dirty, false)
  assert.deepEqual(plain(demo.savedVersions()), records)
})

test('save and view live commits together for overwrite and Save as', () => {
  for (const mode of ['save', 'saveAs'] as const) {
    const browser = setup(), demo = browser.demo, alternative = saveNamed(demo, 'Alternative')
    demo.updatePlan(alternative.plans[0].id, { ...alternative.plans[0], name: 'Retain these changes' })
    const writes = browser.writes
    const live = demo.viewLivePipeline(demo.pipelineSource(), { action: 'save', mode, input: { name: mode === 'save' ? alternative.name : 'Another alternative', note: 'Keep this before returning to live.' } })
    assert.equal(browser.writes, writes + 1)
    assert.equal(live.isLive, true)
    const kept = demo.savedVersions().find(item => item.name === (mode === 'save' ? alternative.name : 'Another alternative'))!
    assert.equal(kept.plans[0].name, 'Retain these changes')
    if (mode === 'saveAs') assert.deepEqual(saved(demo, alternative.id), alternative)
  }
})

test('failed live-view switches do not lose drafts or leave a partially saved copy', () => {
  for (const action of ['discard', 'save', 'saveAs'] as const) {
    const browser = setup(), demo = browser.demo, alternative = saveNamed(demo, 'Alternative')
    demo.updatePlan(alternative.plans[0].id, { ...alternative.plans[0], name: 'Important work' })
    const source = demo.pipelineSource(), raw = browser.raw
    browser.fail()
    assert.throws(() => demo.viewLivePipeline(source, action === 'discard' ? { action: 'discard' } : { action: 'save', mode: action, input: { name: action === 'save' ? alternative.name : 'New alternative', note: 'Keep important work.' } }), /could not be saved/)
    assert.equal(browser.raw, raw); assert.deepEqual(demo.pipelineSource(), source)
  }
})

test('live viewing keeps recorded colours and rules, while editing uses the latest Library', () => {
  const { demo } = setup(), baseline = saved(demo, 'v02'), source = demo.pipelineSource()
  const library = demo.library(); library.types[0].color = '#112233'; library.sharedRules = []
  demo.saveLibrary(library)
  const live = demo.pipelineSource()
  assert.equal(live.dirty, false)
  assert.equal(live.plans[0].phases[0].color, baseline.plans[0].phases[0].color)
  assert.deepEqual(plain(live.rules), plain(baseline.rules))
  assert.throws(() => demo.viewLivePipeline(source), /changed in another page/)
  demo.editBaseline(baseline, live)
  assert.equal(demo.pipelineSource().readOnly, false)
  assert.equal(demo.pipelineSource().isLive, false)
  assert.equal(demo.plans()[0].phases[0].color, '#112233')
  assert.equal(demo.pipelineSource().rules.length, 0)
  assert.equal(demo.plans()[0].phases[0].s, baseline.plans[0].phases[0].s)
})

test('the newly confirmed open pipeline becomes read-only live and is used on fresh entry', () => {
  const { demo } = setup(), alternative = saved(demo, 'v03')
  demo.openPipeline(alternative, demo.pipelineSource())
  confirm(demo, alternative.id)
  assert.equal(demo.pipelineSource().readOnly, true)
  assert.equal(demo.pipelineSource().isLive, true)
  assert.throws(() => demo.updatePlan(demo.plans()[0].id, demo.plans()[0]), /Choose Edit this pipeline/)
  assert.equal(demo.preparePipelineEntry().record!.id, alternative.id)
})
