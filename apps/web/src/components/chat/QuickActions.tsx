'use client';

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  question: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'cyclone-safety',
    label: 'Cyclone Safety',
    icon: '🌀',
    question: 'What should I do during a cyclone?'
  },
  {
    id: 'flood-prep',
    label: 'Flood Prep',
    icon: '🌊',
    question: 'How can I prepare for floods?'
  },
  {
    id: 'emergency-tips',
    label: 'Emergency Tips',
    icon: '🚨',
    question: 'What emergency tips should I know?'
  },
  {
    id: 'coral-reef',
    label: 'Coral Reef',
    icon: '🪸',
    question: 'Tell me about coral reef health'
  },
  {
    id: 'ocean-health',
    label: 'Ocean Health',
    icon: '🌊',
    question: 'How is ocean health in Mauritius?'
  },
  {
    id: 'cyclone-formation',
    label: 'Cyclone Formation',
    icon: '🌪️',
    question: 'What are cyclone formation signs?'
  }
];

interface QuickActionsProps {
  onActionClick: (question: string) => void;
  disabled?: boolean;
}

export default function QuickActions({ onActionClick, disabled = false }: QuickActionsProps) {
  return (
    <div className="space-y-3" role="region" aria-label="Quick action buttons">
      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">
        Quick Actions
      </p>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.id}
            onClick={() => !disabled && onActionClick(action.question)}
            disabled={disabled}
            className="
              flex-shrink-0 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700
              bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700
              transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600
              text-left
            "
            aria-label={`Ask: ${action.question}`}
          >
            <span className="text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">
              {action.question}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
