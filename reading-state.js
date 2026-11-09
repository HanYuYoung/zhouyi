(function exposeReadingState(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ReadingState = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createReadingStateApi() {
  function createEmptyLines() {
    return Array.from({ length: 6 }, () => ({ value: 0, moving: false, raw: null }));
  }

  function isBoardEditable({ method, phase, hasResult, isCasting }) {
    return method === "manual" && phase === "editing" && !hasResult && !isCasting;
  }

  function getLineStatus(phase, lines) {
    const movingCount = lines.filter((line) => line.moving).length;
    if (phase === "editing") return `手动排爻中${movingCount ? ` · ${movingCount} 个动爻` : ""}`;
    if (phase === "ready" || phase === "rendered") return `六爻已成 · ${movingCount ? `${movingCount} 个动爻` : "无动爻"}`;
    return "等待起卦";
  }

  function resetReadingState(state, method) {
    return {
      ...state,
      lines: createEmptyLines(),
      lastResult: null,
      phase: method === "manual" ? "editing" : "idle",
      isCasting: false,
      castToken: (state.castToken || 0) + 1,
    };
  }

  return { createEmptyLines, isBoardEditable, getLineStatus, resetReadingState };
});
