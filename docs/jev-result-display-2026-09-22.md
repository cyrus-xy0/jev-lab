# JEV question results

> 历史开发记录：反映该轮实现与验证，提及的开发验证脚本未随发布包提供。当前行为以 [项目 README](../README.md) 和 [原型说明](prototype.md) 为准。

Each saved judgment is now a separate inline disclosure. The collapsed card presents its question, type and returned result; expanding reveals the applicable candidates or scoring/boolean standards. Long choice descriptions remain complete in the expanded content while the main answer uses a short first-line preview.

## Data and semantics

- The renderer reads the saved request and saved response, never current form text or a generated summary. Official short titles are only used while the complete saved question still equals its original catalog question.
- The existing local completion event is preserved verbatim. Its output JSON and older saved outputs remain compatible. The renderer also accepts the documented HTTP `answers` envelope without changing or pretending to call the real API.
- Choice shows the returned key's description and marks that candidate. Null descriptions fall back to the key. Legacy description matching is allowed only for a unique match. A candidate probability is shown only when provided.
- Score shows the returned continuous value without rounding it to a grade or recalculating it from displayed probabilities. Returned legend arrays/numeric-key objects supply standards; saved request criteria are the fallback. Only a contiguous zero-based legend defines the range and position axis.
- Noul shows `P(true)` and its binary complement. It does not treat the number as a returned boolean or display a non-contract confidence field.
- Choice/Score confidence uses its own returned field, never the largest probability. Missing fields do not acquire values, bars or percentages. Zero and false remain meaningful values.
- Raw JSON remains exclusively in the existing result detail disclosure. Unknown fields are preserved there. Preview, running, failed, cancelled, missing and awaiting-model states never display an old completed answer; anonymously edited copies hide the original output entirely.
- Result disclosure state and summary focus survive live panel redraws. Native keyboard activation and Escape are supported.

Official contracts verified against [API](https://docs.typesafe.ai/api), [Choice](https://docs.typesafe.ai/primitives/choice), [Noul](https://docs.typesafe.ai/primitives/noul), [Score](https://docs.typesafe.ai/primitives/score) and [Confidence](https://docs.typesafe.ai/confidence). Current execution remains local Mock; no mock probabilities or confidence values were added.

## Validation

- 24 result regression groups passed: real local adapter events; native HTTP shapes; zero/false; continuous scores; nested descriptions; missing/invalid/unknown fields; duplicate labels; null criteria; response legend priority; type mismatch; saved request provenance; public isolation and complete raw JSON preservation.
- Existing input regression: 19 groups passed, including all 42 requests / 115 questions and independent option editing. Reset/cancellation regression: 5 groups passed.
- Browser: B09's three types in preview, live run and saved history; inline expand/collapse; another model's live updates; keyboard Escape/Enter; desktop and 390px mobile, no horizontal overflow or console errors.
- A separate, clearly labeled synthetic fixture checked native continuous 1.43/2, a 0/57/43 percent distribution, independent 35 percent confidence, nested/multiline descriptions and unusually long keys on desktop/mobile. These fixtures are not product data and are not deployed.
- Text contrast was increased for descriptions, keys, expansion labels and confidence. JavaScript syntax and whitespace checks passed.
