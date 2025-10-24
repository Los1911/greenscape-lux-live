#!/bin/bash

# Automated Maintenance Script for GreenScape Lux
# Identifies deprecated files based on patterns, age, and git history
# Generates report and requires manual approval before deletion

set -e

# Configuration
REPORT_DIR="maintenance-reports"
REPORT_FILE="${REPORT_DIR}/deprecated-files-$(date +%Y-%m-%d).md"
DELETION_LOG="maintenance-reports/deletion-log.md"
CONFIG_FILE="scripts/maintenance-config.json"
DAYS_THRESHOLD=90  # Files not modified in 90 days

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create report directory
mkdir -p "${REPORT_DIR}"

echo -e "${BLUE}=== GreenScape Lux Automated Maintenance ===${NC}"
echo "Report: ${REPORT_FILE}"
echo ""

# Initialize report
cat > "${REPORT_FILE}" << 'EOF'
# Deprecated Files Maintenance Report
**Generated:** $(date)
**Threshold:** Files not modified in ${DAYS_THRESHOLD} days

## Summary
This report identifies files that may be deprecated based on:
- File naming patterns (AUDIT, DIAGNOSTIC, FIX, REPORT, etc.)
- Last modification date (>90 days old)
- Git commit history analysis

## Candidates for Deletion

EOF

# Deprecated file patterns
PATTERNS=(
  "*AUDIT*.md"
  "*DIAGNOSTIC*.md"
  "*FIX*.md"
  "*REPORT*.md"
  "*GUIDE*.md"
  "*IMPLEMENTATION*.md"
  "*DEPLOYMENT*.md"
  "*CLEANUP*.md"
  "*STATUS*.md"
  "*COMPLETE*.md"
  "*TODO*.md"
  "*CHECKLIST*.md"
)

# Protected patterns (never delete)
PROTECTED=(
  "README.md"
  "CHANGELOG.md"
  "LICENSE.md"
  "CONTRIBUTING.md"
  ".github/*"
  "scripts/automated-maintenance.sh"
  "scripts/maintenance-config.json"
  "supabase/*"
  "src/*"
  "public/*"
  "package.json"
  "vite.config.ts"
  "tsconfig*.json"
)

# Function to check if file is protected
is_protected() {
  local file="$1"
  for pattern in "${PROTECTED[@]}"; do
    if [[ "$file" == $pattern ]]; then
      return 0
    fi
  done
  return 1
}

# Find deprecated files
echo -e "${YELLOW}Scanning for deprecated files...${NC}"
CANDIDATES=()
CANDIDATE_COUNT=0

for pattern in "${PATTERNS[@]}"; do
  while IFS= read -r file; do
    if [ -f "$file" ] && ! is_protected "$file"; then
      # Check last modified date
      if [ "$(uname)" == "Darwin" ]; then
        # macOS
        mod_date=$(stat -f %m "$file")
      else
        # Linux
        mod_date=$(stat -c %Y "$file")
      fi
      
      current_date=$(date +%s)
      days_old=$(( (current_date - mod_date) / 86400 ))
      
      if [ $days_old -gt $DAYS_THRESHOLD ]; then
        CANDIDATES+=("$file|$days_old")
        ((CANDIDATE_COUNT++))
      fi
    fi
  done < <(find . -name "$pattern" -type f 2>/dev/null)
done

echo -e "${GREEN}Found ${CANDIDATE_COUNT} candidates${NC}"
echo ""

# Generate detailed report
echo "### Files Older Than ${DAYS_THRESHOLD} Days" >> "${REPORT_FILE}"
echo "" >> "${REPORT_FILE}"
echo "| File | Days Old | Last Modified | Size |" >> "${REPORT_FILE}"
echo "|------|----------|---------------|------|" >> "${REPORT_FILE}"

for candidate in "${CANDIDATES[@]}"; do
  IFS='|' read -r file days <<< "$candidate"
  
  if [ "$(uname)" == "Darwin" ]; then
    last_mod=$(stat -f "%Sm" -t "%Y-%m-%d" "$file")
    size=$(stat -f "%z" "$file")
  else
    last_mod=$(stat -c "%y" "$file" | cut -d' ' -f1)
    size=$(stat -c "%s" "$file")
  fi
  
  size_kb=$((size / 1024))
  echo "| \`$file\` | $days | $last_mod | ${size_kb}KB |" >> "${REPORT_FILE}"
done

echo "" >> "${REPORT_FILE}"
echo "## Git History Analysis" >> "${REPORT_FILE}"
echo "" >> "${REPORT_FILE}"

# Analyze git history for each candidate
for candidate in "${CANDIDATES[@]}"; do
  IFS='|' read -r file days <<< "$candidate"
  
  if git ls-files --error-unmatch "$file" > /dev/null 2>&1; then
    last_commit=$(git log -1 --format="%h - %s (%ar)" -- "$file" 2>/dev/null || echo "No commits")
    echo "- **$file**: $last_commit" >> "${REPORT_FILE}"
  fi
done

echo "" >> "${REPORT_FILE}"
echo "## Recommended Actions" >> "${REPORT_FILE}"
echo "" >> "${REPORT_FILE}"
echo "Total files identified: **${CANDIDATE_COUNT}**" >> "${REPORT_FILE}"
echo "" >> "${REPORT_FILE}"
echo "### To approve deletion:" >> "${REPORT_FILE}"
echo "\`\`\`bash" >> "${REPORT_FILE}"
echo "bash scripts/automated-maintenance.sh --approve" >> "${REPORT_FILE}"
echo "\`\`\`" >> "${REPORT_FILE}"
echo "" >> "${REPORT_FILE}"
echo "### To review individual files:" >> "${REPORT_FILE}"
echo "\`\`\`bash" >> "${REPORT_FILE}"
echo "cat maintenance-reports/deprecated-files-$(date +%Y-%m-%d).md" >> "${REPORT_FILE}"
echo "\`\`\`" >> "${REPORT_FILE}"

# Display report
echo -e "${BLUE}=== Report Generated ===${NC}"
cat "${REPORT_FILE}"

# Check for approval flag
if [[ "$1" == "--approve" ]]; then
  echo ""
  echo -e "${YELLOW}⚠️  DELETION MODE ACTIVATED${NC}"
  echo -e "${RED}This will permanently delete ${CANDIDATE_COUNT} files${NC}"
  echo ""
  read -p "Type 'DELETE' to confirm: " confirmation
  
  if [[ "$confirmation" == "DELETE" ]]; then
    echo -e "${RED}Deleting files...${NC}"
    
    # Initialize deletion log if it doesn't exist
    if [ ! -f "${DELETION_LOG}" ]; then
      echo "# Deletion Log" > "${DELETION_LOG}"
      echo "" >> "${DELETION_LOG}"
    fi
    
    # Log deletion session
    echo "## Deletion Session: $(date)" >> "${DELETION_LOG}"
    echo "" >> "${DELETION_LOG}"
    
    DELETED_COUNT=0
    for candidate in "${CANDIDATES[@]}"; do
      IFS='|' read -r file days <<< "$candidate"
      
      if [ -f "$file" ]; then
        echo "Deleting: $file"
        rm "$file"
        echo "- \`$file\` (${days} days old)" >> "${DELETION_LOG}"
        ((DELETED_COUNT++))
      fi
    done
    
    echo "" >> "${DELETION_LOG}"
    echo "**Total deleted:** ${DELETED_COUNT} files" >> "${DELETION_LOG}"
    echo "" >> "${DELETION_LOG}"
    
    echo -e "${GREEN}✓ Deleted ${DELETED_COUNT} files${NC}"
    echo -e "${GREEN}✓ Deletion log updated: ${DELETION_LOG}${NC}"
  else
    echo -e "${YELLOW}Deletion cancelled${NC}"
  fi
else
  echo ""
  echo -e "${YELLOW}Report generated. No files deleted.${NC}"
  echo -e "${BLUE}To approve deletion, run:${NC}"
  echo "  bash scripts/automated-maintenance.sh --approve"
fi

echo ""
echo -e "${GREEN}=== Maintenance Complete ===${NC}"
