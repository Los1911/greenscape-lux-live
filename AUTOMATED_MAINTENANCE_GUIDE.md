# Automated Maintenance System Guide

## Overview

GreenScape Lux now includes an automated maintenance system that identifies and manages deprecated files in the repository. The system runs monthly and generates reports of files that may be candidates for deletion.

## Features

### 🔍 Intelligent Detection
- **Pattern matching**: Identifies files with AUDIT, DIAGNOSTIC, FIX, REPORT patterns
- **Age analysis**: Flags files not modified in 90+ days
- **Git history**: Analyzes commit history for each file
- **Size tracking**: Reports file sizes for cleanup impact assessment

### 🛡️ Safety Safeguards
- **Protected patterns**: Never flags production-critical files
- **Manual approval**: Requires explicit confirmation before deletion
- **Deletion logging**: Maintains comprehensive log of all deletions
- **Rollback support**: Git history preserved for easy recovery

### 📊 Reporting
- **Detailed reports**: Generated in `maintenance-reports/` directory
- **GitHub Issues**: Automatically creates issues with findings
- **Artifacts**: Reports uploaded to GitHub Actions for 90 days
- **Historical logs**: Tracks all maintenance activities

## Quick Start

### Run Manual Scan

```bash
# Generate report (no deletion)
bash scripts/automated-maintenance.sh

# Review the report
cat maintenance-reports/deprecated-files-$(date +%Y-%m-%d).md
```

### Approve Deletion

```bash
# Run with approval flag
bash scripts/automated-maintenance.sh --approve

# Type 'DELETE' when prompted to confirm
```

## Automated Monthly Execution

The system runs automatically via GitHub Actions:

**Schedule**: 1st of every month at 2 AM UTC

**Workflow**: `.github/workflows/monthly-maintenance.yml`

**Actions**:
1. Scans repository for deprecated files
2. Generates detailed report
3. Creates GitHub issue with findings
4. Uploads report as artifact
5. Waits for manual approval

### Manual Trigger

Trigger the workflow manually:
1. Navigate to **Actions** tab on GitHub
2. Select **"Monthly Repository Maintenance"**
3. Click **"Run workflow"**
4. Select branch and click **"Run workflow"**

## Configuration

### Edit Settings

File: `scripts/maintenance-config.json`

```json
{
  "settings": {
    "daysThreshold": 90,
    "reportDirectory": "maintenance-reports",
    "deletionLogFile": "maintenance-reports/deletion-log.md"
  }
}
```

### Deprecated Patterns

Files matching these patterns are flagged:
- `*AUDIT*.md`
- `*DIAGNOSTIC*.md`
- `*FIX*.md`
- `*REPORT*.md`
- `*GUIDE*.md`
- `*IMPLEMENTATION*.md`
- `*DEPLOYMENT*.md`
- `*CLEANUP*.md`
- `*STATUS*.md`
- `*COMPLETE*.md`

### Protected Patterns

These files are **never** flagged:
- `README.md`, `CHANGELOG.md`, `LICENSE.md`
- `.github/**/*` (workflows)
- `supabase/**/*` (database functions)
- `src/**/*` (source code)
- `package.json`, `vite.config.ts`
- `.env*` (environment files)

## Report Structure

### Sample Report

```markdown
# Deprecated Files Maintenance Report
**Generated:** 2025-01-15
**Threshold:** Files not modified in 90 days

## Summary
Found 45 candidates for deletion

### Files Older Than 90 Days
| File | Days Old | Last Modified | Size |
|------|----------|---------------|------|
| STRIPE_AUDIT.md | 120 | 2024-09-15 | 45KB |
| FIX_COMPLETE.md | 95 | 2024-10-10 | 12KB |

## Git History Analysis
- **STRIPE_AUDIT.md**: abc123 - Initial audit (4 months ago)
- **FIX_COMPLETE.md**: def456 - Fix applied (3 months ago)

## Recommended Actions
Total files identified: **45**
```

## Deletion Log

All deletions are logged in `maintenance-reports/deletion-log.md`:

```markdown
## Deletion Session: 2025-01-15 14:30:00
- `STRIPE_AUDIT.md` (120 days old)
- `FIX_COMPLETE.md` (95 days old)
**Total deleted:** 2 files
```

## Rollback Procedure

If files are accidentally deleted:

### Option 1: Git Restore

```bash
# View deletion log
cat maintenance-reports/deletion-log.md

# Restore specific file
git checkout HEAD~1 -- path/to/deleted/file.md

# Restore all files from last commit
git checkout HEAD~1 -- .
```

### Option 2: Git History

```bash
# Find commit before deletion
git log --oneline -- path/to/deleted/file.md

# Restore from specific commit
git checkout <commit-hash> -- path/to/deleted/file.md
```

## Best Practices

### Before Approval
1. ✅ Review the generated report thoroughly
2. ✅ Check git history for each flagged file
3. ✅ Verify no production dependencies
4. ✅ Confirm files are truly deprecated
5. ✅ Backup important documentation

### After Deletion
1. ✅ Review deletion log
2. ✅ Verify build still succeeds (`npm run build`)
3. ✅ Check environment variables (`npm run verify:env`)
4. ✅ Test critical functionality
5. ✅ Commit changes with descriptive message

### Monthly Routine
1. 📧 Receive GitHub issue notification
2. 📊 Review maintenance report
3. 🔍 Analyze flagged files
4. ✅ Approve deletion if appropriate
5. 🧪 Verify build and tests
6. 📝 Update documentation if needed

## Troubleshooting

### Script Won't Run

```bash
# Make executable
chmod +x scripts/automated-maintenance.sh

# Check bash version
bash --version  # Requires 4.0+
```

### Protected File Flagged

Edit `scripts/maintenance-config.json` and add to `protectedPatterns`:

```json
{
  "protectedPatterns": [
    "YOUR_FILE_PATTERN.md"
  ]
}
```

### GitHub Action Fails

1. Check workflow logs in Actions tab
2. Verify permissions: `contents: write`, `pull-requests: write`
3. Ensure `maintenance-reports/` directory exists
4. Check git configuration in workflow

## Security Considerations

- ✅ Script requires explicit `--approve` flag for deletion
- ✅ Confirmation prompt requires typing "DELETE"
- ✅ Protected patterns prevent critical file deletion
- ✅ All deletions logged with timestamps
- ✅ Git history preserved for rollback
- ✅ GitHub Actions requires manual approval

## Support

For issues or questions:
1. Check `maintenance-reports/README.md`
2. Review deletion log for history
3. Examine `scripts/maintenance-config.json`
4. Check GitHub Actions workflow logs
5. Restore from git history if needed

---

**Last Updated:** 2025-01-15
**Version:** 1.0.0
