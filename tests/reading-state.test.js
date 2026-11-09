const test = require("node:test");
const assert = require("node:assert/strict");
const ReadingState = require("../reading-state.js");

test("only manual editing mode allows line changes", () => {
  assert.equal(ReadingState.isBoardEditable({ method: "coins", phase: "idle", hasResult: false, isCasting: false }), false);
  assert.equal(ReadingState.isBoardEditable({ method: "quick", phase: "ready", hasResult: false, isCasting: false }), false);
  assert.equal(ReadingState.isBoardEditable({ method: "manual", phase: "editing", hasResult: false, isCasting: false }), true);
  assert.equal(ReadingState.isBoardEditable({ method: "manual", phase: "rendered", hasResult: true, isCasting: false }), false);
});

test("reset clears the active reading but preserves history", () => {
  const previous = {
    mode: "cast",
    lines: [{ value: 1, moving: true, raw: 9 }],
    lastResult: { id: 1 },
    history: [{ id: 1 }],
    phase: "rendered",
    isCasting: true,
    castToken: 4,
  };
  const next = ReadingState.resetReadingState(previous, "coins");

  assert.equal(next.lastResult, null);
  assert.equal(next.phase, "idle");
  assert.equal(next.isCasting, false);
  assert.equal(next.castToken, 5);
  assert.equal(next.lines.length, 6);
  assert.ok(next.lines.every((line) => line.value === 0 && line.moving === false && line.raw === null));
  assert.deepEqual(next.history, previous.history);
});

test("manual reset enters editing mode", () => {
  const next = ReadingState.resetReadingState({ castToken: 0 }, "manual");
  assert.equal(next.phase, "editing");
});

test("line status distinguishes editing from a completed cast", () => {
  const lines = ReadingState.createEmptyLines();
  lines[0].moving = true;
  lines[1].moving = true;

  assert.equal(ReadingState.getLineStatus("idle", lines), "等待起卦");
  assert.equal(ReadingState.getLineStatus("editing", lines), "手动排爻中 · 2 个动爻");
  assert.equal(ReadingState.getLineStatus("ready", lines), "六爻已成 · 2 个动爻");
  assert.equal(ReadingState.getLineStatus("rendered", ReadingState.createEmptyLines()), "六爻已成 · 无动爻");
});
