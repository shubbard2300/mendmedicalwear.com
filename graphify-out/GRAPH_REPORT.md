# Graph Report - .  (2026-08-05)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 315 nodes · 362 edges · 34 communities (28 shown, 6 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cfbb218d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- analyze_videos.py
- Path
- main.js
- x-research/scripts/analyze_posts.py
- instagram-research/scripts/analyze_posts.py
- tiktok-research/scripts/analyze_posts.py
- What You Must Do When Invoked
- fetch_instagram
- get_channel_videos.py
- fetch_tiktok
- fetch_tweets
- Workflow
- Workflow
- TikTok Research
- Workflow
- Workflow
- Workflow
- MEND Pulse — Product Detail Page: Design Brief
- graphify reference: extra exports and benchmark
- Video Content Analyzer
- Platform-Specific Sections
- graphify reference: query, path, explain
- Channel Analysis Schema
- Content Ideas Template
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- graphify
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- .claude/CLAUDE.md
- extraction-spec.md
- README.md

## God Nodes (most connected - your core abstractions)
1. `What You Must Do When Invoked` - 12 edges
2. `/graphify` - 10 edges
3. `analyze_videos()` - 9 edges
4. `Workflow` - 9 edges
5. `MEND Pulse — Product Detail Page: Design Brief` - 9 edges
6. `Workflow` - 8 edges
7. `graphify reference: extra exports and benchmark` - 8 edges
8. `main()` - 7 edges
9. `main()` - 7 edges
10. `Workflow` - 7 edges

## Surprising Connections (you probably didn't know these)
- `main()` --calls--> `Path`  [INFERRED]
  .claude/skills/instagram-research/scripts/analyze_posts.py →   _Bridges community 4 → community 1_
- `fetch_instagram()` --calls--> `Path`  [INFERRED]
  .claude/skills/instagram-research/scripts/fetch_instagram.py →   _Bridges community 7 → community 1_
- `main()` --calls--> `Path`  [INFERRED]
  .claude/skills/tiktok-research/scripts/analyze_posts.py →   _Bridges community 5 → community 1_
- `fetch_tiktok()` --calls--> `Path`  [INFERRED]
  .claude/skills/tiktok-research/scripts/fetch_tiktok.py →   _Bridges community 9 → community 1_
- `main()` --calls--> `Path`  [INFERRED]
  .claude/skills/video-content-analyzer/scripts/analyze_videos.py →   _Bridges community 0 → community 1_

## Import Cycles
- None detected.

## Communities (34 total, 6 thin omitted)

### Community 0 - "analyze_videos.py"
Cohesion: 0.15
Nodes (19): analyze_video(), analyze_videos(), download_video(), extract_post_data(), get_field(), is_video_post(), main(), parse_response() (+11 more)

### Community 1 - "Path"
Cohesion: 0.13
Nodes (25): edit(), generate(), get_api_key(), handle_response(), load_env_file(), main(), Load .env file by walking up from this script's location., download_thumbnail() (+17 more)

### Community 2 - "main.js"
Cohesion: 0.19
Nodes (16): drawGenericCard(), drawLogoFit(), drawMockup(), drawOnPhoto(), drawWatermark(), ensureSourceStyles(), esc(), handleFile() (+8 more)

### Community 3 - "x-research/scripts/analyze_posts.py"
Cohesion: 0.19
Nodes (15): analyze_content_patterns(), calculate_engagement_rate(), calculate_engagement_score(), extract_topics(), identify_outliers(), load_posts(), main(), Extract only essential fields from an outlier tweet for lean output. (+7 more)

### Community 4 - "instagram-research/scripts/analyze_posts.py"
Cohesion: 0.26
Nodes (11): calculate_engagement_rate(), calculate_engagement_score(), extract_topics(), identify_outliers(), load_posts(), main(), Load posts from JSON file., Calculate weighted engagement score. - Comments (3x): Active engagement - Likes… (+3 more)

### Community 5 - "tiktok-research/scripts/analyze_posts.py"
Cohesion: 0.26
Nodes (11): calculate_engagement_rate(), calculate_engagement_score(), extract_topics(), identify_outliers(), load_posts(), main(), Load videos from JSON file., Calculate weighted engagement score for TikTok. - Comments (3x): Active… (+3 more)

### Community 6 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 7 - "fetch_instagram"
Cohesion: 0.36
Nodes (7): fetch_instagram(), fetch_profiles(), main(), parse_accounts_file(), Parse instagram-accounts.md and extract usernames., Fetch Instagram profile data (follower counts, etc.) using the profile scraper.…, Fetch Instagram content from specified usernames using Apify Instagram Scraper.…

### Community 8 - "get_channel_videos.py"
Cohesion: 0.36
Nodes (7): get_api_key(), get_channel_videos(), load_env_file(), main(), Load .env file from project root., Get TubeLab API key from environment., Fetch videos from a YouTube channel using TubeLab API. Args: channel_id:…

### Community 9 - "fetch_tiktok"
Cohesion: 0.47
Nodes (5): fetch_tiktok(), main(), parse_accounts_file(), Parse tiktok-accounts.md and extract usernames., Fetch TikTok videos from specified usernames using Apify TikTok Scraper. Args:…

### Community 10 - "fetch_tweets"
Cohesion: 0.47
Nodes (5): fetch_tweets(), main(), parse_accounts_file(), Parse x-accounts.md and extract handles., Fetch tweets from specified handles using Apify Tweet Scraper V2. Args:…

### Community 12 - "Workflow"
Cohesion: 0.12
Nodes (16): find_outliers.py, get_channel_videos.py, Prerequisites, Quick Reference, Scoring Algorithm, Script Reference, Step 1: Create Run Folder, Step 2: Get Channel ID (+8 more)

### Community 13 - "Workflow"
Cohesion: 0.14
Nodes (13): 1. Read User Context, 2. Create Master Run Folder, 3. Launch Research Subagents in Parallel, 4. Collect Research Results, 5. Generate Content Ideas, 6. Generate Platform Playbooks, 7. Present Summary, Content Planner (+5 more)

### Community 14 - "TikTok Research"
Cohesion: 0.17
Nodes (11): 1. Create Run Folder, 2. Fetch Content, 3. Identify Outliers, 4. Analyze Top Videos with AI, 5. Generate Report, Engagement Metrics, Prerequisites, Quick Reference (+3 more)

### Community 15 - "Workflow"
Cohesion: 0.17
Nodes (11): 1. Create Run Folder, 2. Fetch Tweets, 3. Identify Outliers, 4. Analyze Videos with AI (Optional), 5. Generate Report, Engagement Metrics, Output Location, Prerequisites (+3 more)

### Community 16 - "Workflow"
Cohesion: 0.18
Nodes (10): Content & compliance notes, Image Generator, Prerequisites, Step 1: Write a strong prompt, Step 2: Pick a size matching where the image is used, Step 3: Generate, Step 4: Review before using, Step 5: Name and place it (+2 more)

### Community 17 - "Workflow"
Cohesion: 0.18
Nodes (10): 1. Create Run Folder, 2. Fetch Content, 3. Identify Outliers, 4. Analyze Top Videos with AI, 5. Generate Report, Engagement Metrics, Instagram Research, Prerequisites (+2 more)

### Community 18 - "MEND Pulse — Product Detail Page: Design Brief"
Cohesion: 0.20
Nodes (9): 1 · Naming, 2 · Design tokens, 3 · UX layout (section order & jobs), 4 · Component hierarchy (Next.js), 5 · Suggested animations, 6 · Responsive guidance, 7 · Image generation prompts (photorealistic renders), 8 · Implementation notes (+1 more)

### Community 19 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 20 - "Video Content Analyzer"
Cohesion: 0.22
Nodes (8): Content Formats, Hook Techniques, Input Format, Output, Parameters, Prerequisites, Usage, Video Content Analyzer

### Community 21 - "Platform-Specific Sections"
Cohesion: 0.33
Nodes (5): Instagram Additions, Platform Playbook Template, Platform-Specific Sections, X/Twitter Additions, YouTube Additions

### Community 22 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 23 - "Channel Analysis Schema"
Cohesion: 0.33
Nodes (5): Channel Analysis Schema, Example Output, Field Definitions, Prompt, Response Schema

### Community 24 - "Content Ideas Template"
Cohesion: 0.50
Nodes (3): Content Ideas Template, Cross-Platform Topic Matching, Opportunity Score Calculation

### Community 25 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 26 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 27 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

## Knowledge Gaps
- **125 isolated node(s):** `graphify`, `Prerequisites`, `1. Read User Context`, `2. Create Master Run Folder`, `3. Launch Research Subagents in Parallel` (+120 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `main()` connect `analyze_videos.py` to `Path`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `main()` connect `x-research/scripts/analyze_posts.py` to `Path`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `main()` connect `instagram-research/scripts/analyze_posts.py` to `Path`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Are the 11 inferred relationships involving `Path` (e.g. with `edit()` and `load_env_file()`) actually correct?**
  _`Path` has 11 INFERRED edges - model-reasoned connections that need verification._
- **What connects `graphify`, `Prerequisites`, `1. Read User Context` to the rest of the system?**
  _125 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Path` be split into smaller, more focused modules?**
  _Cohesion score 0.12535612535612536 - nodes in this community are weakly interconnected._
- **Should `What You Must Do When Invoked` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._