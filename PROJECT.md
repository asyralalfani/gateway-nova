# PROJECT.md

Project planning and scope document. Update this file whenever goals or scope change.

## Summary

**Gateway Nova** is a self-hosted web app for organizing and documenting internal team tools/URLs in a single place. Deployed via Docker.

## Problems It Solves

The team currently struggles with:
- Remembering URLs for every internal tool (Jenkins, Grafana, Confluence, internal dashboards, etc.)
- Onboarding new members requires sending lists manually via chat/email
- No single place to see "all the tools the team uses"
- Browser bookmarks are personal and can't be shared

## Solution

An internal homepage app with:
1. **Organized tool list** grouped by category
2. **Editor UI** so team members can add and edit entries directly
3. **Search & filter** for finding tools fast
4. **Self-hosted** via Docker — data stays on team infrastructure
5. **Simple** — bundled PostgreSQL via docker-compose, no external services

## MVP Scope (v1.0)

### Included

- [x] CRUD entries (title, URL, description, icon, category, tags)
- [x] Tool grouping by category (e.g. "DevOps", "Monitoring", "Documentation")
- [x] Search by name/description/tag
- [x] Filter by category or tag
- [x] Tidy responsive grid layout (desktop & mobile)
- [x] Dark mode (follows system by default)
- [x] Simple authentication (username + password) — optional, enabled via env
- [x] Roles: admin (CRUD) vs viewer (read-only)
- [x] Docker deployment with a single command

### Out of Scope (beyond MVP)

- ❌ Real-time service status widgets (maybe v2)
- ❌ SSO/OAuth integration (v2)
- ❌ Multi-tenant / multi-workspace
- ❌ Notifications or alerting
- ❌ Native mobile app
- ❌ Audit log (maybe v1.1 if needed)

## Roadmap

### v1.0 — MVP (target: 4 weeks)
- All MVP scope features
- Setup documentation
- Docker image ready to deploy

### v1.1 — Polish
- Drag & drop reorder
- Import/export config as JSON/YAML
- Simple audit log
- Automatic PostgreSQL backups

### v2.0 — Integrations
- Service status widgets (URL ping, status code, response time)
- OAuth/SSO (Google, GitHub, generic OIDC)
- Per-user favorite tags

## User Personas

### 1. Tech Lead "Andi"
- Initial app setup
- Adds base categories and tools
- Manages other users
- **Needs**: easy deployment, reliable backups

### 2. Engineer "Budi" (most frequent user)
- Opens the app each morning to access tools
- Occasionally adds a new tool their squad uses
- **Needs**: fast search, 1-2 clicks to any tool

### 3. Manager "Citra"
- Onboards new members
- Wants an overview of tools in use
- **Needs**: clean layout, easy to share

## Success Metrics

- ⏱️ Time-to-first-tool < 3 seconds from app open
- 👥 100% of team members using it within the first month
- 📝 At least 30 tools registered in the first 2 weeks
- 🔧 Setup on a fresh server < 10 minutes

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| PostgreSQL needs tuning for scale | Low | Default config handles thousands of entries; tune `shared_buffers`/`work_mem` later if needed |
| Team doesn't keep entries up to date | High | Very simple UI; periodic Slack reminders |
| Server downtime | Medium | Automated PostgreSQL backups to team S3/storage |
| Forgotten admin password | Low | CLI command for password reset |

## Stakeholders

- **Owner**: [Your Name]
- **Dev Team**: [Your Team]
- **Users**: Entire engineering team (~30-50 people)

## Related Links

- Inspiration: https://gethomepage.dev/
- Inspiration: https://heimdall.site/
- Inspiration: https://github.com/Lissy93/dashy
