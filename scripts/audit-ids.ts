#!/usr/bin/env ts-node
import * as fs from 'fs';
import * as path from 'path';

interface Violation {
  file: string;
  line: number;
  code: string;
  rule: string;
  description: string;
  suggestion?: string;
}

const violations: Violation[] = [];

// Rule checking functions
const checkReactKeys = (content: string, filePath: string) => {
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('key=') && !line.includes('key={') && !line.includes('.id}')) {
      if (line.includes('key={index}') || line.includes('key={i}') || line.includes('key={idx}')) {
        violations.push({
          file: filePath,
          line: idx + 1,
          code: line.trim(),
          rule: 'R1',
          description: 'React key using array index instead of entity.id',
          suggestion: 'Use key={item.id} instead of array index'
        });
      }
    }
  });
};

const checkSupabaseSelects = (content: string, filePath: string) => {
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('.select(') && (line.includes('jobs') || line.includes('landscaper_documents') || line.includes('landscapers'))) {
      if (!line.includes('id') && !line.includes('*')) {
        violations.push({
          file: filePath,
          line: idx + 1,
          code: line.trim(),
          rule: 'R2',
          description: 'Supabase select missing id field',
          suggestion: 'Include id in select statement'
        });
      }
    }
  });
};

const checkFabricatedIds = (content: string, filePath: string) => {
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('id:') && (line.includes("'d'") || line.includes('String(') || line.includes('shortid'))) {
      violations.push({
        file: filePath,
        line: idx + 1,
        code: line.trim(),
        rule: 'R3',
        description: 'Fabricated id detected',
        suggestion: 'Use actual UUID from database'
      });
    }
  });
};

const checkIdEquality = (content: string, filePath: string) => {
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes(".eq('id',") && !line.includes('isUUID(') && !line.includes('.eq(\'id\', id)')) {
      violations.push({
        file: filePath,
        line: idx + 1,
        code: line.trim(),
        rule: 'R4',
        description: 'ID equality check without UUID validation',
        suggestion: 'Validate with isUUID() or ensure variable is named id'
      });
    }
  });
};

const checkIdShadowing = (content: string, filePath: string) => {
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('id: _') || line.includes('id: unused')) {
      violations.push({
        file: filePath,
        line: idx + 1,
        code: line.trim(),
        rule: 'R5',
        description: 'ID field being shadowed/renamed',
        suggestion: 'Keep id field accessible for handlers/modals'
      });
    }
  });
};

// File scanning
const scanFile = (filePath: string) => {
  if (!fs.existsSync(filePath)) return;
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  checkReactKeys(content, filePath);
  checkSupabaseSelects(content, filePath);
  checkFabricatedIds(content, filePath);
  checkIdEquality(content, filePath);
  checkIdShadowing(content, filePath);
};

const scanDirectory = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) return;
  
  const items = fs.readdirSync(dirPath);
  items.forEach(item => {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
      scanFile(fullPath);
    }
  });
};

// Generate report
const generateReport = () => {
  const ruleCounts = {
    R1: violations.filter(v => v.rule === 'R1').length,
    R2: violations.filter(v => v.rule === 'R2').length,
    R3: violations.filter(v => v.rule === 'R3').length,
    R4: violations.filter(v => v.rule === 'R4').length,
    R5: violations.filter(v => v.rule === 'R5').length,
  };

  let report = `# ID/UUID Consistency Audit Report\n\n`;
  report += `**Generated:** ${new Date().toISOString()}\n\n`;
  report += `## Summary\n\n`;
  report += `- **R1 (React Keys):** ${ruleCounts.R1} violations\n`;
  report += `- **R2 (Supabase Selects):** ${ruleCounts.R2} violations\n`;
  report += `- **R3 (Fabricated IDs):** ${ruleCounts.R3} violations\n`;
  report += `- **R4 (ID Equality):** ${ruleCounts.R4} violations\n`;
  report += `- **R5 (ID Shadowing):** ${ruleCounts.R5} violations\n`;
  report += `- **Total:** ${violations.length} violations\n\n`;

  if (violations.length === 0) {
    report += `## ✅ No violations found!\n\n`;
    report += `All ID/UUID usage appears consistent across the Landscaper Dashboard.\n`;
  } else {
    report += `## Detailed Findings\n\n`;
    
    ['R1', 'R2', 'R3', 'R4', 'R5'].forEach(rule => {
      const ruleViolations = violations.filter(v => v.rule === rule);
      if (ruleViolations.length > 0) {
        report += `### ${rule} Violations\n\n`;
        ruleViolations.forEach(v => {
          report += `**${v.file}:${v.line}**\n`;
          report += `\`\`\`typescript\n${v.code}\n\`\`\`\n`;
          report += `*${v.description}*\n`;
          if (v.suggestion) {
            report += `**Suggestion:** ${v.suggestion}\n`;
          }
          report += `\n`;
        });
      }
    });
  }

  fs.writeFileSync('src/audit/ID_AUDIT_REPORT.md', report);
  console.log(`Audit complete. Report written to src/audit/ID_AUDIT_REPORT.md`);
  console.log(`Found ${violations.length} violations.`);
  
  return violations.length;
};

// Main execution
console.log('Starting ID/UUID consistency audit...');

// Scan target directories
scanDirectory('src/components/landscaper');
scanDirectory('src/db');
scanDirectory('src/pages');

const violationCount = generateReport();
process.exit(violationCount > 0 ? 1 : 0);