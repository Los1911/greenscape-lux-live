import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface AISuggestionChipProps {
  landscaperCount: number;
  landscapers: Array<{ rating: number }>;
  visible: boolean;
}

export function AISuggestionChip({ landscaperCount, landscapers, visible }: AISuggestionChipProps) {
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!visible || landscaperCount === 0) return;

    console.log('[COVERAGE_AI] Generating suggestion for', landscaperCount, 'landscapers');

    const fiveStarCount = landscapers.filter(l => l.rating >= 5).length;
    const avgDistance = 2; // Mock distance calculation

    let suggestion = '';
    if (fiveStarCount > 0) {
      suggestion = `${fiveStarCount} landscaper${fiveStarCount > 1 ? 's' : ''} with 5-star ratings nearby.`;
    } else {
      suggestion = `${landscaperCount} landscaper${landscaperCount > 1 ? 's' : ''} available within ${avgDistance} miles.`;
    }

    setMessage(suggestion);
  }, [landscaperCount, landscapers, visible]);

  if (!visible || !message) return null;

  return (
    <div className="ai-chip-fade-in flex items-center gap-2 px-4 py-3 glassmorphic rounded-xl border border-emerald-500/40 shadow-lg">
      <div className="p-1.5 rounded-lg bg-emerald-500/20 ai-sparkle">
        <Sparkles className="w-4 h-4 text-emerald-400" />
      </div>
      <div>
        <p className="text-xs text-emerald-300 font-semibold uppercase tracking-wide">AI Suggestion</p>
        <p className="text-sm text-white font-medium">{message}</p>
      </div>
    </div>
  );
}
