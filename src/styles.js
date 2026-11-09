// Scoped stylesheet, injected once while the plugin is active. Uses the
// harness theme's semantic tokens (with fallbacks) so light/dark follow the app.
export const CSS = `
.dshsp-root {
  --sp-surface: var(--dsw-alias-bg-base, #fcfcfb);
  --sp-card: var(--dsw-alias-bg-base, #fcfcfb);
  --sp-text: var(--dsw-alias-label-primary, #0b0b0b);
  --sp-text-2: var(--dsw-alias-label-secondary, #52514e);
  --sp-text-3: var(--dsw-alias-label-tertiary, #8a8984);
  --sp-border: var(--dsw-alias-border-l2, rgba(0,0,0,.1));
  --sp-grid: var(--dsw-alias-border-l1, rgba(0,0,0,.06));
  --sp-hover: var(--dsw-alias-interactive-bg-hover, rgba(0,0,0,.05));
  --sp-active: var(--dsw-alias-interactive-bg-active, rgba(0,0,0,.08));
  --sp-accent: var(--dsw-alias-brand-primary, #2a78d6);
  --sp-s0: #2a78d6; --sp-s1: #eb6834; --sp-s2: #1baf7a; --sp-s3: #eda100;
  --sp-s4: #e87ba4; --sp-s5: #008300; --sp-s6: #6250d6; --sp-s7: #8f8e88; --sp-s8: #00b4d8;
  --sp-s9: #8a5a2b; --sp-s10: #c43c8f; --sp-s11: #d64545; --sp-s12: #7a9a1f;
  --sp-income: #1a9e5c; --sp-deficit: #d03b3b;
  height: 100%;
  overflow: auto;
  box-sizing: border-box;
  background: var(--sp-surface);
  color: var(--sp-text);
  font-size: 13px;
  line-height: 18px;
}
body[data-ds-dark-theme] .dshsp-root {
  color-scheme: dark;
  --sp-s0: #3987e5; --sp-s1: #d95926; --sp-s2: #199e70; --sp-s3: #c98500;
  --sp-s4: #d55181; --sp-s5: #008300; --sp-s6: #9085e9; --sp-s7: #7d7c77; --sp-s8: #22c7e8;
  --sp-s9: #b07a45; --sp-s10: #d660a8; --sp-s11: #e5605c; --sp-s12: #94b43a;
  --sp-income: #2fb872; --sp-deficit: #e5534b;
}
.dshsp-root *, .dshsp-root *::before, .dshsp-root *::after { box-sizing: border-box; }
.dshsp-inner { padding: 20px 32px 48px; }
.dshsp-head { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; justify-content: space-between;
  padding-left: max(0px, calc(var(--dsh-frame-leading-clearance, 0px) - 24px)); margin-bottom: 16px; }
.dshsp-title { font-size: 22px; line-height: 28px; font-weight: 600; margin: 0; }
.dshsp-sub { color: var(--sp-text-2); margin-top: 2px; }
.dshsp-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.dshsp-btn { appearance: none; border: 0.5px solid var(--sp-border); background: transparent; color: var(--sp-text);
  border-radius: 8px; padding: 6px 12px; font: inherit; cursor: pointer; white-space: nowrap; }
.dshsp-btn:focus-visible, .dshsp-seg button:focus-visible, .dshsp-chip:focus-visible { outline: 2px solid var(--sp-accent); outline-offset: 1px; }
@media (hover: hover) { .dshsp-btn:hover { background: var(--sp-hover); } }
.dshsp-btn-primary { background: var(--sp-text); color: var(--sp-surface); border-color: transparent; }
@media (hover: hover) { .dshsp-btn-primary:hover { background: var(--sp-text); opacity: .88; } }
.dshsp-link { appearance: none; border: 0; background: none; padding: 0 4px; font: inherit; color: var(--sp-text-2);
  cursor: pointer; text-decoration: underline; text-underline-offset: 2px; }
.dshsp-link:focus-visible { outline: 2px solid var(--sp-accent); outline-offset: 1px; border-radius: 4px; }
.dshsp-input.dshsp-path { width: 340px; }
.dshsp-folder { font: 12px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; background: var(--sp-hover); border-radius: 4px;
  padding: 1px 5px; display: inline-block; max-width: min(520px, 60vw); overflow: hidden; text-overflow: ellipsis;
  white-space: nowrap; vertical-align: bottom; }
.dshsp-filters { position: sticky; top: 0; z-index: 3; background: var(--sp-surface); padding: 10px 0; margin: -10px 0 6px;
  border-bottom: 0.5px solid var(--sp-border); display: grid; gap: 8px; }
.dshsp-filter-row { display: flex; flex-wrap: wrap; gap: 8px 10px; align-items: center; }
.dshsp-filter-row > .dshsp-label:first-child { min-width: 52px; }
.dshsp-filter-row .dshsp-chips { margin: 0; flex: 1 1 0; min-width: 0; }
.dshsp-filter-row { align-items: flex-start; }
.dshsp-filter-row:first-child { align-items: center; }
.dshsp-filter-row > .dshsp-label:first-child { line-height: 16px; padding-top: 2px; }
.dshsp-gap { margin-left: 12px; }
.dshsp-push { margin-left: auto; }
.dshsp-pager { display: flex; flex-wrap: wrap; gap: 8px 16px; align-items: center; justify-content: space-between; margin-top: 10px; }
.dshsp-pager .dshsp-more { margin: 0; }
.dshsp-pager-controls { display: flex; flex-wrap: wrap; gap: 8px 12px; align-items: center; }
.dshsp-pager-controls label { display: inline-flex; gap: 6px; align-items: center; }
.dshsp-btn-sm { padding: 3px 10px; font-size: 12px; }
.dshsp-btn:disabled { opacity: .4; cursor: default; background: transparent; }
.dshsp-tiles { margin-top: 16px; }
.dshsp-toolbar { display: flex; flex-wrap: wrap; gap: 8px 16px; align-items: center; margin-bottom: 16px; }
.dshsp-seg { display: inline-flex; padding: 2px; gap: 2px; border-radius: 9px; background: var(--sp-hover); }
.dshsp-seg button { appearance: none; border: 0; background: transparent; color: var(--sp-text-2); font: inherit;
  padding: 4px 10px; border-radius: 7px; cursor: pointer; }
.dshsp-seg button[aria-pressed="true"] { background: var(--sp-surface); color: var(--sp-text); box-shadow: 0 0 0 0.5px var(--sp-border), 0 1px 2px rgba(0,0,0,.06); }
.dshsp-seg button:disabled { opacity: .4; cursor: not-allowed; }
.dshsp-label { color: var(--sp-text-3); font-size: 12px; }
.dshsp-tiles { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 16px; }
@media (max-width: 900px) { .dshsp-tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.dshsp-tile { border: 0.5px solid var(--sp-border); border-radius: 12px; padding: 12px 14px; background: var(--sp-card); }
.dshsp-tile-label { color: var(--sp-text-2); font-size: 12px; }
.dshsp-tile-value { font-size: 22px; line-height: 28px; font-weight: 600; margin-top: 4px; font-variant-numeric: tabular-nums; }
.dshsp-tile-note { color: var(--sp-text-3); font-size: 12px; margin-top: 2px; }
.dshsp-grid { display: grid; grid-template-columns: minmax(280px, 1fr) minmax(0, 2.4fr); gap: 12px; margin-bottom: 12px; }
@media (max-width: 900px) { .dshsp-grid { grid-template-columns: minmax(0, 1fr); } }
.dshsp-card { border: 0.5px solid var(--sp-border); border-radius: 12px; padding: 14px 16px 16px; background: var(--sp-card); min-width: 0; }
.dshsp-card-head { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.dshsp-card-title { font-size: 14px; font-weight: 600; margin: 0; }
.dshsp-card-sub { color: var(--sp-text-3); font-size: 12px; }
.dshsp-donut { display: flex; justify-content: center; align-items: center; min-height: 320px; }
.dshsp-donut-wrap { display: flex; flex-wrap: wrap; gap: 12px 20px; align-items: center; }
.dshsp-donut { flex: 0 0 auto; position: relative; }
.dshsp-legend { flex: 1 1 180px; list-style: none; margin: 0; padding: 0; min-width: 0; }
.dshsp-legend li button { width: 100%; display: grid; grid-template-columns: 10px minmax(0,1fr) auto 44px; gap: 8px; align-items: center;
  appearance: none; border: 0; background: transparent; color: var(--sp-text); font: inherit; text-align: left; padding: 4px 6px; border-radius: 6px; cursor: pointer; }
@media (hover: hover) { .dshsp-legend li button:hover { background: var(--sp-hover); } }
.dshsp-legend li button[aria-pressed="true"] { background: var(--sp-active); }
.dshsp-legend li.dshsp-dim button { opacity: .45; }
.dshsp-sw { width: 10px; height: 10px; border-radius: 3px; }
.dshsp-legend .dshsp-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshsp-num { font-variant-numeric: tabular-nums; text-align: right; }
.dshsp-pct { color: var(--sp-text-3); font-variant-numeric: tabular-nums; text-align: right; }
.dshsp-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.dshsp-chip { appearance: none; display: inline-flex; gap: 6px; align-items: center; border: 0.5px solid var(--sp-border); background: transparent;
  color: var(--sp-text-2); font: inherit; font-size: 12px; padding: 2px 9px; border-radius: 999px; corner-shape: round; cursor: pointer; }
.dshsp-chip[aria-pressed="true"] { background: var(--sp-active); color: var(--sp-text); border-color: transparent; }
@media (hover: hover) { .dshsp-chip:hover { background: var(--sp-hover); } }
.dshsp-chip[data-dim] { opacity: .55; }
.dshsp-chip-num { color: var(--sp-text-3); font-variant-numeric: tabular-nums; }
.dshsp-chip .dshsp-sw { width: 8px; height: 8px; border-radius: 2px; }
.dshsp-chart { position: relative; width: 100%; }
.dshsp-chart svg { display: block; overflow: visible; }
.dshsp-axis { fill: var(--sp-text-3); font-size: 11px; font-variant-numeric: tabular-nums; }
.dshsp-tip { position: absolute; pointer-events: none; z-index: 2; min-width: 170px; max-width: 260px; padding: 8px 10px; border-radius: 10px;
  background: var(--dsw-alias-bg-layer-1, var(--sp-surface)); color: var(--sp-text); font-size: 12px; line-height: 17px;
  box-shadow: var(--dsw-elevation-panel, 0 0 0 0.5px rgba(0,0,0,.12), 0 6px 20px rgba(0,0,0,.12)); }
.dshsp-tip-title { font-weight: 600; margin-bottom: 4px; }
.dshsp-tip-row { display: grid; grid-template-columns: 8px minmax(0,1fr) auto; gap: 6px; align-items: center; }
.dshsp-tip-row .dshsp-sw { width: 8px; height: 8px; border-radius: 2px; }
.dshsp-tip-total { border-top: 0.5px solid var(--sp-border); margin-top: 4px; padding-top: 4px; display: flex; justify-content: space-between; font-weight: 600; }
.dshsp-table-wrap { overflow-x: auto; }
.dshsp-table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
.dshsp-table th { text-align: left; font-weight: 500; color: var(--sp-text-3); font-size: 12px; padding: 6px 8px; border-bottom: 0.5px solid var(--sp-border); white-space: nowrap; }
.dshsp-table td { padding: 5px 8px; border-bottom: 0.5px solid var(--sp-grid); vertical-align: middle; }
.dshsp-table td.dshsp-num, .dshsp-table th.dshsp-num { text-align: right; }
.dshsp-table .dshsp-merchant { max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshsp-select { font: inherit; font-size: 12px; color: var(--sp-text); background: transparent; border: 0.5px solid var(--sp-border); border-radius: 6px; padding: 2px 4px; }
.dshsp-input { font: inherit; color: var(--sp-text); background: transparent; border: 0.5px solid var(--sp-border); border-radius: 8px; padding: 5px 10px; min-width: 0; width: 220px; max-width: 100%; }
.dshsp-refund { color: var(--sp-s5); }
.dshsp-surplus { color: var(--sp-income); }
.dshsp-deficit { color: var(--sp-deficit); }
.dshsp-account { color: var(--sp-text-2); white-space: nowrap; }
.dshsp-empty { border: 1px dashed var(--sp-border); border-radius: 16px; padding: 48px 24px; text-align: center; color: var(--sp-text-2); }
.dshsp-empty p { max-width: 640px; margin: 0 auto; line-height: 1.6; }
.dshsp-empty code { font: 12px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; background: var(--sp-hover); border-radius: 4px; padding: 1px 5px; word-break: break-all; }
.dshsp-empty h2 { color: var(--sp-text); font-size: 16px; margin: 12px 0 4px; }
.dshsp-notice { margin-bottom: 12px; padding: 8px 12px; border-radius: 8px; background: var(--sp-hover); color: var(--sp-text-2); }
.dshsp-notice.dshsp-error { color: #d03b3b; }
.dshsp-notice-dismissable { display: flex; align-items: flex-start; gap: 8px; }
.dshsp-notice-dismissable > span { flex: 1; }
.dshsp-notice-close { flex: none; border: 0; background: transparent; color: var(--sp-text-3); cursor: pointer; font-size: 16px; line-height: 1; padding: 2px 4px; border-radius: 4px; }
.dshsp-notice-close:hover { color: var(--sp-text); background: var(--sp-card); }
.dshsp-more { margin-top: 8px; color: var(--sp-text-3); font-size: 12px; }
`
