# Week 1 Review

Generated at: 2026-06-10T10:58:21.795Z

## Summary
- Processed companies: 21
- Companies with crawl data: 18
- Companies with generated profiles: 18
- Logos saved successfully: 17
- Companies with potential unsupported profile fields: 18

## Common Issues
- Some companies have no crawl data, so downstream review is blocked.
- Some companies have no generated profile.json output.
- Some logos were discovered in metadata but were not saved successfully.
- Some companies have no clear logo candidate in crawl output.
- Some profile fields are not obviously supported by raw markdown or metadata and need manual review.
- Several companies still have many null or empty fields after synthesis.

## Company Reviews

## 1way2cloud
- Company domain: 1way2cloud.com
- Accuracy notes:
  - Crawl data exists and can be manually compared against the generated profile.
  - Potential unsupported fields flagged: description, focusAreas (AWS Cloud Migration, Cloud-Native Development), technologies (AWS Services), location, companySize, foundedYear, industries (Computers Electronics and Technology), githubUrl, linkedinUrl, logoUrl.
  - Several fields remain empty: recentActivity.
- Missing fields: recentActivity
- Hallucinated fields: description, focusAreas (AWS Cloud Migration, Cloud-Native Development), technologies (AWS Services), location, companySize, foundedYear, industries (Computers Electronics and Technology), githubUrl, linkedinUrl, logoUrl
- Logo status: Success

## 4data.ch
- Company domain: 4data.ch
- Accuracy notes:
  - Crawl data exists and can be manually compared against the generated profile.
  - Potential unsupported fields flagged: companyName, website, description, focusAreas (Business value optimization, Operational cost reduction, Time to market improvement, Application scaling and automation), technologies (Containerization, Infrastructure as code, CI/CD), location, companySize, foundedYear, industries (Computers Electronics and Technology), linkedinUrl, logoUrl.
  - Several fields remain empty: vendorPartnerships, recentActivity, githubUrl.
- Missing fields: vendorPartnerships, recentActivity, githubUrl
- Hallucinated fields: companyName, website, description, focusAreas (Business value optimization, Operational cost reduction, Time to market improvement, Application scaling and automation), technologies (Containerization, Infrastructure as code, CI/CD), location, companySize, foundedYear, industries (Computers Electronics and Technology), linkedinUrl, logoUrl
- Logo status: Success

## b-nova Schweiz GmbH
- Company domain: b-nova.com
- Accuracy notes:
  - Crawl data exists and can be manually compared against the generated profile.
  - Potential unsupported fields flagged: companyName, website, focusAreas (DevOps, Quality Assurance), location, foundedYear, industries (Software Development, AI/Machine Learning, IT Consulting), githubUrl, linkedinUrl, logoUrl.
  - Several fields remain empty: vendorPartnerships.
- Missing fields: vendorPartnerships
- Hallucinated fields: companyName, website, focusAreas (DevOps, Quality Assurance), location, foundedYear, industries (Software Development, AI/Machine Learning, IT Consulting), githubUrl, linkedinUrl, logoUrl
- Logo status: Success

## bespinian
- Company domain: bespinian.io
- Accuracy notes:
  - Crawl data exists and can be manually compared against the generated profile.
  - Potential unsupported fields flagged: website, description, focusAreas (Cloud modernization, Infrastructure cost reduction, DevOps culture transformation, Multi-tenant SaaS solutions, Team productivity enhancement), technologies (Terraform, JavaScript, TypeScript, Docker, OpenShift), location, companySize, foundedYear, industries (Software Development, DevOps Consulting), recentActivity (Blog post: Using Claude Code on AWS Bedrock, Blog post: Cloud Migration - What Mountains Can Teach Us About Digital Transformation, Blog post: OpenBao: When to Choose the Open Source Vault Alternative, Success story: Kubernetes Training and Jitsi Deployment), githubUrl, linkedinUrl.
  - All expected profile fields were populated.
- Missing fields: None
- Hallucinated fields: website, description, focusAreas (Cloud modernization, Infrastructure cost reduction, DevOps culture transformation, Multi-tenant SaaS solutions, Team productivity enhancement), technologies (Terraform, JavaScript, TypeScript, Docker, OpenShift), location, companySize, foundedYear, industries (Software Development, DevOps Consulting), recentActivity (Blog post: Using Claude Code on AWS Bedrock, Blog post: Cloud Migration - What Mountains Can Teach Us About Digital Transformation, Blog post: OpenBao: When to Choose the Open Source Vault Alternative, Success story: Kubernetes Training and Jitsi Deployment), githubUrl, linkedinUrl
- Logo status: Success

## copebit AG
- Company domain: copebit.ch
- Accuracy notes:
  - Crawl data exists and can be manually compared against the generated profile.
  - Potential unsupported fields flagged: website, description, focusAreas (Cloud Migration and Transformation, AWS Well-Architected Framework, Infrastructure Automation, Security and Compliance), technologies (Docker, Terraform), location, companySize, foundedYear, industries (Cloud Computing, IT Consulting, Infrastructure Automation), recentActivity (Multiple client testimonials from major projects with Swisscom, WARP resizing project completion with 600+ network changes, ALPSTEIN cloud infrastructure project delivery, ARI Government VPDC implementation, ElproCloud migration projects), githubUrl, linkedinUrl, logoUrl.
  - All expected profile fields were populated.
- Missing fields: None
- Hallucinated fields: website, description, focusAreas (Cloud Migration and Transformation, AWS Well-Architected Framework, Infrastructure Automation, Security and Compliance), technologies (Docker, Terraform), location, companySize, foundedYear, industries (Cloud Computing, IT Consulting, Infrastructure Automation), recentActivity (Multiple client testimonials from major projects with Swisscom, WARP resizing project completion with 600+ network changes, ALPSTEIN cloud infrastructure project delivery, ARI Government VPDC implementation, ElproCloud migration projects), githubUrl, linkedinUrl, logoUrl
- Logo status: Success

## écociel AG
- Company domain: ecociel.swiss
- Accuracy notes:
  - Crawl data exists and can be manually compared against the generated profile.
  - Potential unsupported fields flagged: description, focusAreas (REST Architecture), technologies (Terraform, Apache Spark, Raspberry Pi), location, industries (IT Consulting, Cloud Computing), recentActivity (Active development in Rust and Go projects, Recent GitHub activity with nio client libraries, Ongoing work on authorization servers and job processing systems, Website maintenance and updates), githubUrl, linkedinUrl, logoUrl.
  - Several fields remain empty: vendorPartnerships.
- Missing fields: vendorPartnerships
- Hallucinated fields: description, focusAreas (REST Architecture), technologies (Terraform, Apache Spark, Raspberry Pi), location, industries (IT Consulting, Cloud Computing), recentActivity (Active development in Rust and Go projects, Recent GitHub activity with nio client libraries, Ongoing work on authorization servers and job processing systems, Website maintenance and updates), githubUrl, linkedinUrl, logoUrl
- Logo status: Success

## Example
- Company domain: example.com
- Accuracy notes:
  - No crawl data available, so profile accuracy cannot be reviewed.
  - No profile.json data available for this company.
  - Several fields remain empty: companyName, website, description, focusAreas, technologies, vendorPartnerships, location, companySize, foundedYear, industries, recentActivity, githubUrl, linkedinUrl, logoUrl.
- Missing fields: companyName, website, description, focusAreas, technologies, vendorPartnerships, location, companySize, foundedYear, industries, recentActivity, githubUrl, linkedinUrl, logoUrl
- Hallucinated fields: None flagged
- Logo status: Not found

## Floads GmbH
- Company domain: floads.io
- Accuracy notes:
  - Crawl data exists and can be manually compared against the generated profile.
  - Potential unsupported fields flagged: website, description, focusAreas (Site Reliability Engineering, Infrastructure Automation, Database Operations, Cloud Cost Optimization, Zero-downtime Migrations), technologies (Terraform, Ansible, Python, Shell, Makefile), location, industries (Computers Electronics and Technology), recentActivity (Released syseng toolkit for system engineers with database migration and Kubernetes debugging tools, Developed aiops control panel for multi-tenant Git workspaces and AI-assisted coding, Created mmonit-hub unified dashboard for monitoring multiple M/Monit instances, Completed zero-downtime MySQL migration at TB scale for fintech company, Achieved 40% cost reduction for Kubernetes cluster optimization), githubUrl, linkedinUrl, logoUrl.
  - Several fields remain empty: vendorPartnerships, foundedYear.
- Missing fields: vendorPartnerships, foundedYear
- Hallucinated fields: website, description, focusAreas (Site Reliability Engineering, Infrastructure Automation, Database Operations, Cloud Cost Optimization, Zero-downtime Migrations), technologies (Terraform, Ansible, Python, Shell, Makefile), location, industries (Computers Electronics and Technology), recentActivity (Released syseng toolkit for system engineers with database migration and Kubernetes debugging tools, Developed aiops control panel for multi-tenant Git workspaces and AI-assisted coding, Created mmonit-hub unified dashboard for monitoring multiple M/Monit instances, Completed zero-downtime MySQL migration at TB scale for fintech company, Achieved 40% cost reduction for Kubernetes cluster optimization), githubUrl, linkedinUrl, logoUrl
- Logo status: Success

## Friendly Nerds
- Company domain: friendlynerds.ch
- Accuracy notes:
  - Crawl data exists and can be manually compared against the generated profile.
  - Potential unsupported fields flagged: focusAreas (Artificial Intelligence, Cloud Computing, Software Development, Business Process Automation, Digital Transformation, Startup Solutions), technologies (Ruby, HTML), location, companySize, industries (Technology Consulting, Software Development, Cloud Services, Artificial Intelligence), recentActivity ([object Object]), githubUrl, linkedinUrl.
  - Several fields remain empty: vendorPartnerships, foundedYear.
- Missing fields: vendorPartnerships, foundedYear
- Hallucinated fields: focusAreas (Artificial Intelligence, Cloud Computing, Software Development, Business Process Automation, Digital Transformation, Startup Solutions), technologies (Ruby, HTML), location, companySize, industries (Technology Consulting, Software Development, Cloud Services, Artificial Intelligence), recentActivity ([object Object]), githubUrl, linkedinUrl
- Logo status: Success

## incratec GmbH
- Company domain: incratec.com
- Accuracy notes:
  - Crawl data exists and can be manually compared against the generated profile.
  - Potential unsupported fields flagged: description, focusAreas (AI Strategy & Governance, Software Development with AI, AI Training, AI in Bern region), technologies (Identity & Access Management, PHP, C#, HCL, Shell), vendorPartnerships (Microsoft Switzerland), location, foundedYear, industries (AI Consulting, Software Development, Digital Transformation, IT Consulting), recentActivity (ChatGPT Skills article (March 2026), Effective meetings with Copilot article (February 2026), Microsoft Copilot updates article (November 2025), AI Software Engineering webinar (October 2025)), githubUrl, linkedinUrl.
  - All expected profile fields were populated.
- Missing fields: None
- Hallucinated fields: description, focusAreas (AI Strategy & Governance, Software Development with AI, AI Training, AI in Bern region), technologies (Identity & Access Management, PHP, C#, HCL, Shell), vendorPartnerships (Microsoft Switzerland), location, foundedYear, industries (AI Consulting, Software Development, Digital Transformation, IT Consulting), recentActivity (ChatGPT Skills article (March 2026), Effective meetings with Copilot article (February 2026), Microsoft Copilot updates article (November 2025), AI Software Engineering webinar (October 2025)), githubUrl, linkedinUrl
- Logo status: Success

## nxt Engineering GmbH
- Company domain: nxt.engineering
- Accuracy notes:
  - Crawl data exists and can be manually compared against the generated profile.
  - Potential unsupported fields flagged: description, focusAreas (Custom Software Development, Strategic Technology Consulting, Business Process Automation, Software Architecture, System Integration, Digital Transformation), technologies (Python, Cloud-native Architectures), location, foundedYear, industries (Software Development, Technology Consulting, Digital Services), githubUrl, linkedinUrl, logoUrl.
  - Several fields remain empty: vendorPartnerships, recentActivity.
- Missing fields: vendorPartnerships, recentActivity
- Hallucinated fields: description, focusAreas (Custom Software Development, Strategic Technology Consulting, Business Process Automation, Software Architecture, System Integration, Digital Transformation), technologies (Python, Cloud-native Architectures), location, foundedYear, industries (Software Development, Technology Consulting, Digital Services), githubUrl, linkedinUrl, logoUrl
- Logo status: Success

## ONZACK AG
- Company domain: onzack.com
- Accuracy notes:
  - Crawl data exists and can be manually compared against the generated profile.
  - Potential unsupported fields flagged: companyName, website, description, focusAreas (Cloud Native Technologies, Container Technologies, Monitoring und Observability, Container Security, Infrastructure Automation), technologies (Cilium, Shell, Python, HCL), location, industries (Computers Electronics and Technology, Cloud Native Technologies), recentActivity (hubble-observer - Observability component for Cilium network flows, kaniko-chainguard - Container image maintenance, cf2cnp - CLI tool for CiliumNetworkPolicies, grafana-dashboards - Kubernetes monitoring dashboards, provider-cloudscale - Crossplane provider), githubUrl, linkedinUrl, logoUrl.
  - Several fields remain empty: vendorPartnerships, foundedYear.
- Missing fields: vendorPartnerships, foundedYear
- Hallucinated fields: companyName, website, description, focusAreas (Cloud Native Technologies, Container Technologies, Monitoring und Observability, Container Security, Infrastructure Automation), technologies (Cilium, Shell, Python, HCL), location, industries (Computers Electronics and Technology, Cloud Native Technologies), recentActivity (hubble-observer - Observability component for Cilium network flows, kaniko-chainguard - Container image maintenance, cf2cnp - CLI tool for CiliumNetworkPolicies, grafana-dashboards - Kubernetes monitoring dashboards, provider-cloudscale - Crossplane provider), githubUrl, linkedinUrl, logoUrl
- Logo status: Success

## Openai
- Company domain: openai.com
- Accuracy notes:
  - No crawl data available, so profile accuracy cannot be reviewed.
  - No profile.json data available for this company.
  - Several fields remain empty: companyName, website, description, focusAreas, technologies, vendorPartnerships, location, companySize, foundedYear, industries, recentActivity, githubUrl, linkedinUrl, logoUrl.
- Missing fields: companyName, website, description, focusAreas, technologies, vendorPartnerships, location, companySize, foundedYear, industries, recentActivity, githubUrl, linkedinUrl, logoUrl
- Hallucinated fields: None flagged
- Logo status: Not found

## Palark GmbH
- Company domain: palark.com
- Accuracy notes:
  - Crawl data exists and can be manually compared against the generated profile.
  - Potential unsupported fields flagged: website, technologies (Docker, Python, Shell, CSS, HCL, Jinja), foundedYear, industries (Cloud Computing, Software Infrastructure, Technology Services), recentActivity (Top 100 companies contributing to Kubernetes, Running Kubernative channel, Publishing tech blogs, CNCF Ambassador in team), githubUrl, linkedinUrl, logoUrl.
  - All expected profile fields were populated.
- Missing fields: None
- Hallucinated fields: website, technologies (Docker, Python, Shell, CSS, HCL, Jinja), foundedYear, industries (Cloud Computing, Software Infrastructure, Technology Services), recentActivity (Top 100 companies contributing to Kubernetes, Running Kubernative channel, Publishing tech blogs, CNCF Ambassador in team), githubUrl, linkedinUrl, logoUrl
- Logo status: Success

## Peak Scale
- Company domain: peakscale.ch
- Accuracy notes:
  - Crawl data exists and can be manually compared against the generated profile.
  - Potential unsupported fields flagged: companyName, website, description, focusAreas (Cloud Native, IT excellence, digital transformation), location, companySize, foundedYear, industries (Computers Electronics and Technology), githubUrl, linkedinUrl, logoUrl.
  - Several fields remain empty: technologies, vendorPartnerships, recentActivity.
- Missing fields: technologies, vendorPartnerships, recentActivity
- Hallucinated fields: companyName, website, description, focusAreas (Cloud Native, IT excellence, digital transformation), location, companySize, foundedYear, industries (Computers Electronics and Technology), githubUrl, linkedinUrl, logoUrl
- Logo status: Success

## Acme Cloud Labs
- Company domain: proof.local
- Accuracy notes:
  - Crawl data exists and can be manually compared against the generated profile.
  - Potential unsupported fields flagged: location, githubUrl, linkedinUrl.
  - Several fields remain empty: recentActivity.
- Missing fields: recentActivity
- Hallucinated fields: location, githubUrl, linkedinUrl
- Logo status: Failed

## Puzzle ITC
- Company domain: puzzle.ch
- Accuracy notes:
  - Crawl data exists and can be manually compared against the generated profile.
  - Potential unsupported fields flagged: companyName, website, description, focusAreas (Open Source Software, Time Tracking, Resource Planning, Skill Management, OKR Management, Firewall Configuration, DevOps Tools), technologies (Java, Ruby, TypeScript, Python, Haml, HTML, SCSS, CoffeeScript, JavaScript, Shell, Dockerfile, PLpgSQL, Makefile, Mustache, CSS, MDX, Ansible), location, companySize, foundedYear, industries (Software Development, Information Technology), recentActivity (backstage-techlab project development, OKR application development, PuzzleTime time tracking application updates, PCTS Sheet Project development, Skills management application updates, cert-manager webhook for DNSimple, Puzzle shell design system updates, OpenSense Ansible collection development), githubUrl, linkedinUrl, logoUrl.
  - Several fields remain empty: vendorPartnerships.
- Missing fields: vendorPartnerships
- Hallucinated fields: companyName, website, description, focusAreas (Open Source Software, Time Tracking, Resource Planning, Skill Management, OKR Management, Firewall Configuration, DevOps Tools), technologies (Java, Ruby, TypeScript, Python, Haml, HTML, SCSS, CoffeeScript, JavaScript, Shell, Dockerfile, PLpgSQL, Makefile, Mustache, CSS, MDX, Ansible), location, companySize, foundedYear, industries (Software Development, Information Technology), recentActivity (backstage-techlab project development, OKR application development, PuzzleTime time tracking application updates, PCTS Sheet Project development, Skills management application updates, cert-manager webhook for DNSimple, Puzzle shell design system updates, OpenSense Ansible collection development), githubUrl, linkedinUrl, logoUrl
- Logo status: Success

## re:cinq
- Company domain: re-cinq.com
- Accuracy notes:
  - Crawl data exists and can be manually compared against the generated profile.
  - Potential unsupported fields flagged: companyName, website, description, focusAreas (AI-assisted development, Multi-agent pipelines, Sustainable software solutions, Zero IT-related carbon emissions, Coding agents and automation), technologies (TypeScript, JavaScript, Python, HTML, CSS, Shell, Docker, Kubernetes, Istio, gRPC, HCL, Vue, Nix), vendorPartnerships (Green Software Foundation), location, companySize, foundedYear, industries (Programming and Developer Software, Computers Electronics and Technology), recentActivity (shift-log: Save coding agents' conversations in Git Notes, automatically, wave: Multi-agent pipelines for AI-assisted development, lore-oss: Shared context infrastructure for Claude Code, hiring-bias: LLM résumé screener bias measurement tool, assembly-line: Runs agents in a chain, triggered by Git branches), githubUrl, linkedinUrl, logoUrl.
  - All expected profile fields were populated.
- Missing fields: None
- Hallucinated fields: companyName, website, description, focusAreas (AI-assisted development, Multi-agent pipelines, Sustainable software solutions, Zero IT-related carbon emissions, Coding agents and automation), technologies (TypeScript, JavaScript, Python, HTML, CSS, Shell, Docker, Kubernetes, Istio, gRPC, HCL, Vue, Nix), vendorPartnerships (Green Software Foundation), location, companySize, foundedYear, industries (Programming and Developer Software, Computers Electronics and Technology), recentActivity (shift-log: Save coding agents' conversations in Git Notes, automatically, wave: Multi-agent pipelines for AI-assisted development, lore-oss: Shared context infrastructure for Claude Code, hiring-bias: LLM résumé screener bias measurement tool, assembly-line: Runs agents in a chain, triggered by Git branches), githubUrl, linkedinUrl, logoUrl
- Logo status: Success

## tim&koko
- Company domain: tim-koko.ch
- Accuracy notes:
  - Crawl data exists and can be manually compared against the generated profile.
  - Potential unsupported fields flagged: companyName, website, description, focusAreas (Cloud transformation, Cloud Native solutions, Open Source solutions, Kubernetes, OpenTelemetry, Container technologies), technologies (TypeScript, HTML, Python, JavaScript, Dockerfile, Java, C#, Rust, Kubernetes, OpenTelemetry, Kanister, KubeVirt, Helm, OpenShift), vendorPartnerships (Rhätische Bahn, Adcubum), location, companySize, foundedYear, industries (Computers Electronics and Technology, Programming and Developer Software, Business Services), recentActivity (Website development and maintenance, Kanister kubectl container image development, KubeVirt demonstrations and training, Application monitoring with Helm charts, OpenTelemetry implementation demos, OpenShift Virtualization training materials), githubUrl, linkedinUrl, logoUrl.
  - All expected profile fields were populated.
- Missing fields: None
- Hallucinated fields: companyName, website, description, focusAreas (Cloud transformation, Cloud Native solutions, Open Source solutions, Kubernetes, OpenTelemetry, Container technologies), technologies (TypeScript, HTML, Python, JavaScript, Dockerfile, Java, C#, Rust, Kubernetes, OpenTelemetry, Kanister, KubeVirt, Helm, OpenShift), vendorPartnerships (Rhätische Bahn, Adcubum), location, companySize, foundedYear, industries (Computers Electronics and Technology, Programming and Developer Software, Business Services), recentActivity (Website development and maintenance, Kanister kubectl container image development, KubeVirt demonstrations and training, Application monitoring with Helm charts, OpenTelemetry implementation demos, OpenShift Virtualization training materials), githubUrl, linkedinUrl, logoUrl
- Logo status: Success

## Vercel
- Company domain: vercel.com
- Accuracy notes:
  - No crawl data available, so profile accuracy cannot be reviewed.
  - No profile.json data available for this company.
  - Several fields remain empty: companyName, website, description, focusAreas, technologies, vendorPartnerships, location, companySize, foundedYear, industries, recentActivity, githubUrl, linkedinUrl, logoUrl.
- Missing fields: companyName, website, description, focusAreas, technologies, vendorPartnerships, location, companySize, foundedYear, industries, recentActivity, githubUrl, linkedinUrl, logoUrl
- Hallucinated fields: None flagged
- Logo status: Not found

## VSHN AG
- Company domain: vshn.ch
- Accuracy notes:
  - Crawl data exists and can be manually compared against the generated profile.
  - Potential unsupported fields flagged: companyName, website, description, focusAreas (DevOps, Cloud Native, Container, Kubernetes, Application Automation, Cloud Operations, On-premises Operations), technologies (Kubernetes, Docker, TypeScript, Python, Ruby, Shell, Makefile, JavaScript, HTML), location, companySize, foundedYear, industries (Programming and Developer Software, Computers Electronics and Technology, Banking and Financial Services), recentActivity (slapper - It slaps your service into AppCat form!, homebrew-tap - Homebrew Formulae to VSHN's projects, kharon - Kharon ferries your connections safely across SSH jumphosts into private networks, embedded-search-engine - Search engine meant to be embedded inside a Kubernetes / OpenShift pod running an Antora-generated website, vale - Docker image containing an Asciidoc + Microsoft rules aware version of the vale tool, clap - Claim Lifecycle and Provisioning (CLAP) for AppSlap, application-catalog-docs - VSHN Application Catalog Documentation), githubUrl, linkedinUrl, logoUrl.
  - Several fields remain empty: vendorPartnerships.
- Missing fields: vendorPartnerships
- Hallucinated fields: companyName, website, description, focusAreas (DevOps, Cloud Native, Container, Kubernetes, Application Automation, Cloud Operations, On-premises Operations), technologies (Kubernetes, Docker, TypeScript, Python, Ruby, Shell, Makefile, JavaScript, HTML), location, companySize, foundedYear, industries (Programming and Developer Software, Computers Electronics and Technology, Banking and Financial Services), recentActivity (slapper - It slaps your service into AppCat form!, homebrew-tap - Homebrew Formulae to VSHN's projects, kharon - Kharon ferries your connections safely across SSH jumphosts into private networks, embedded-search-engine - Search engine meant to be embedded inside a Kubernetes / OpenShift pod running an Antora-generated website, vale - Docker image containing an Asciidoc + Microsoft rules aware version of the vale tool, clap - Claim Lifecycle and Provisioning (CLAP) for AppSlap, application-catalog-docs - VSHN Application Catalog Documentation), githubUrl, linkedinUrl, logoUrl
- Logo status: Success
