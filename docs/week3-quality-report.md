# Week 3 Quality Report

Generated: 2026-06-17T12:29:17.202Z

## Prompt Iteration

- Added conservative extraction rules to prevent unsupported values from website, GitHub, or enrichment data.
- Added explicit vendor-partnership rules that exclude customers, clients, tools merely used, case-study brands, and repository dependencies.
- Added source preferences: Apollo/Clearbit for company metadata, website copy for services/partnerships, GitHub only for repository activity and technologies.
- Added logo instructions to prefer Brandfetch or clear website logo assets over favicons.

## Before/After Comparison

- Week 2 vendor-partnership assessment mix: `better`: 2, `different`: 1, `missing`: 8, `worse`: 6.
- Week 3 completed profiles in new corpus: 60/60.
- Week 3 logo success rate in new corpus: 60/60 (100%).
- Week 3 review sample size: 20 profiles.

## Per-Field Accuracy

| Field | Reviewed Values | Accuracy |
| --- | ---: | ---: |
| companyName | 20 | 100% |
| website | 20 | 100% |
| description | 20 | 98% |
| services | 18 | 94% |
| focusAreas | 18 | 94% |
| technologies | 20 | 90% |
| vendorPartnerships | 8 | 94% |
| location | 5 | 100% |
| companySize | 4 | 100% |
| foundedYear | 4 | 100% |
| recentActivity | 17 | 91% |
| githubUrl | 18 | 100% |
| linkedinUrl | 5 | 100% |
| logoUrl | 20 | 100% |
| industries | 3 | 33% |

## Sampled Companies

- amanox.ch: logo=yes, source=brandfetch
- liquidreply.com: logo=yes, source=brandfetch
- netcloud.ch: logo=yes, source=profile-logo
- kreuzwerker.de: logo=yes, source=website-logo
- iteratec.com: logo=yes, source=profile-logo
- cloudflight.io: logo=yes, source=brandfetch
- codecentric.de: logo=yes, source=profile-logo
- bechtle.com: logo=yes, source=profile-logo
- senacor.com: logo=yes, source=profile-logo
- eraneos.com: logo=yes, source=profile-logo
- adesso.ch: logo=yes, source=crawl-logo
- adesso.de: logo=yes, source=profile-logo
- bbv.ch: logo=yes, source=crawl-logo
- netcetera.com: logo=yes, source=profile-logo
- bridging-it.de: logo=yes, source=crawl-logo
- arvato-systems.com: logo=yes, source=profile-logo
- nexplore.ch: logo=yes, source=profile-logo
- cloudscale.ch: logo=yes, source=crawl-image
- qaware.de: logo=yes, source=brandfetch
- inovex.de: logo=yes, source=brandfetch

## Review Notes

- Detailed per-field review rows are in `docs/week3-quality-review.csv`.
- Status meanings: `supported` = directly supported by saved source data, `partial` = likely supported but not exact, `unsupported` = review manually, `empty` = field was not populated.
- Vendor partnerships use stricter scoring: provider name must appear near partnership/certification/member language.