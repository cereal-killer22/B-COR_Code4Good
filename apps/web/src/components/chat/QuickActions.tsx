'use client';

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  question: string;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'cyan';
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'cyclone-safety',
    label: 'Cyclone Safety',
    icon: '🌀',
    question: 'What should I do during a cyclone?',
    color: 'cyan'
  },
  {
    id: 'flood-prep',
    label: 'Flood Prep',
    icon: '🌊',
    question: 'How can I prepare for floods?',
    color: 'blue'
  },
  {
    id: 'emergency-tips',
    label: 'Emergency Tips',
    icon: '🚨',
    question: 'What emergency tips should I know?',
    color: 'orange'
  },
  {
    id: 'coral-reef',
    label: 'Coral Reef',
    icon: '🪸',
    question: 'Tell me about coral reef health',
    color: 'green'
  },
  {
    id: 'ocean-health',
    label: 'Ocean Health',
    icon: '🌊',
    question: 'How is ocean health in Mauritius?',
    color: 'cyan'
  },
  {
    id: 'cyclone-formation',
    label: 'Cyclone Formation',
    icon: '🌪️',
    question: 'What are cyclone formation signs?',
    color: 'purple'
  }
];

interface QuickActionsProps {
  onActionClick: (question: string) => void;
  disabled?: boolean;
}

export default function QuickActions({ onActionClick, disabled = false }: QuickActionsProps) {
  const getColorClasses = (color: QuickAction['color']) => {
    const colors = {
      blue: 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 border-2 border-blue-300 dark:border-blue-700 hover:bg-gradient-to-br hover:from-blue-200 hover:to-blue-300 dark:hover:from-blue-800/50 dark:hover:to-blue-700/50 hover:border-blue-400 dark:hover:border-blue-600 text-blue-800 dark:text-blue-200 shadow-blue-200/50 dark:shadow-blue-900/20',
      green: 'bg-gradient-to-br from-emerald-100 to-green-200 dark:from-emerald-900/40 dark:to-green-800/40 border-2 border-emerald-300 dark:border-emerald-700 hover:bg-gradient-to-br hover:from-emerald-200 hover:to-green-300 dark:hover:from-emerald-800/50 dark:hover:to-green-700/50 hover:border-emerald-400 dark:hover:border-emerald-600 text-emerald-800 dark:text-emerald-200 shadow-emerald-200/50 dark:shadow-emerald-900/20',
      orange: 'bg-gradient-to-br from-orange-100 to-amber-200 dark:from-orange-900/40 dark:to-amber-800/40 border-2 border-orange-300 dark:border-orange-700 hover:bg-gradient-to-br hover:from-orange-200 hover:to-amber-300 dark:hover:from-orange-800/50 dark:hover:to-amber-700/50 hover:border-orange-400 dark:hover:border-orange-600 text-orange-800 dark:text-orange-200 shadow-orange-200/50 dark:shadow-orange-900/20',
      purple: 'bg-gradient-to-br from-purple-100 to-violet-200 dark:from-purple-900/40 dark:to-violet-800/40 border-2 border-purple-300 dark:border-purple-700 hover:bg-gradient-to-br hover:from-purple-200 hover:to-violet-300 dark:hover:from-purple-800/50 dark:hover:to-violet-700/50 hover:border-purple-400 dark:hover:border-purple-600 text-purple-800 dark:text-purple-200 shadow-purple-200/50 dark:shadow-purple-900/20',
      cyan: 'bg-gradient-to-br from-cyan-100 to-blue-200 dark:from-cyan-900/40 dark:to-blue-800/40 border-2 border-cyan-300 dark:border-cyan-700 hover:bg-gradient-to-br hover:from-cyan-200 hover:to-blue-300 dark:hover:from-cyan-800/50 dark:hover:to-blue-700/50 hover:border-cyan-400 dark:hover:border-cyan-600 text-cyan-800 dark:text-cyan-200 shadow-cyan-200/50 dark:shadow-cyan-900/20'
    };
    return colors[color];
  };

  return (
    <div className="space-y-4" role="region" aria-label="Quick action buttons">
      <div className="flex items-center gap-3 px-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-300 to-transparent dark:via-cyan-700" />
        <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
          Quick Actions
        </p>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-300 to-transparent dark:via-cyan-700" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.id}
            onClick={() => !disabled && onActionClick(action.question)}
            disabled={disabled}
            className={`
              group px-4 py-3 rounded-xl border-2 transition-all duration-300
              motion-safe:transform motion-safe:hover:scale-105 motion-safe:hover:-translate-y-1 motion-safe:active:scale-95
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0
              focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-cyan-400 dark:focus:ring-cyan-500
              shadow-lg hover:shadow-xl
              ${getColorClasses(action.color)}
            `}
            aria-label={`Ask about ${action.label}`}
            aria-disabled={disabled}
          >
            <div className="flex flex-col items-center gap-2">
              <span className="text-2xl motion-safe:group-hover:scale-110 motion-safe:group-hover:rotate-6 transition-transform duration-300">
                {action.icon}
              </span>
              <span className="text-xs font-bold text-center leading-tight">
                {action.label}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
