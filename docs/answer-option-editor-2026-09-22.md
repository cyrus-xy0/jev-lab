# JEV answer option editor

> 历史开发记录：反映该轮实现与验证，提及的开发验证脚本未随发布包提供。当前行为以 [项目 README](../README.md) 和 [原型说明](prototype.md) 为准。

The request editor now labels state as 当前状态. Choice and score settings use one row per answer or scoring level, with add/edit/remove controls. These controls configure the model request; they do not select a model answer. State and question remain editable on the same page.

## Native request preservation

- Choice criteria retain original object keys. Removing a middle item does not reassign surviving keys; new items receive unused keys.
- Score criteria retain their ordered string array. Labels use the native zero-based index, so removing a level shifts subsequent scores consistently with that array.
- Multiline strings remain single items. No newline splitting or implicit trimming occurs during capture or serialization.
- Type switching caches each type's own rows. Questions and the LLM prompt remain independent.
- Original body/question extra fields, legacy array questions/options, and unsupported criteria values remain intact. Unsupported configurations can be inspected in expanded request details.
- Noul optional standards may all be cleared to omit criteria. Partially blank standards are rejected; untouched native empty structures remain intact.
- Anonymous preview edits use a separate form. The complete request is available in a collapsed disclosure and updates with edits. Private history is unchanged; edited public copies hide old results.

## Validation

- 19 behavioral groups passed: all 42 official requests / 115 questions round-trip unchanged; 13 score arrays; stable keys; multiline/unknown values; per-type/per-question isolation; blank/duplicate validation; actual adapter inputs; concurrent runs; rerun isolation; legacy history; public edits and optional Noul standards.
- Independent data review passed 8 groups, including null criteria, unknown fields and `__proto__` question IDs.
- Reset regression passed 5 groups, covering running/finished/legacy tasks, cancelled jobs and late callbacks. Fresh rows and caches clear without changing saved history.
- Browser checks: official B01 choice and B02 score; add/edit/remove; empty and duplicate focus; type and question switching; request JSON; live mock runs; reset; public preview isolation. Desktop and 390px mobile viewport checked, no horizontal overflow or console errors.
- JavaScript syntax and git whitespace checks passed. Current execution remains Mock-only.
