import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
}

export default function MarkdownEditor({ value, onChange, placeholder, minRows = 4 }: Props) {
  const [mode, setMode] = useState<'write' | 'preview'>('write');

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 border-b border-border pb-1">
        <button
          type="button"
          onClick={() => setMode('write')}
          className={`px-2.5 py-0.5 rounded text-xs font-medium transition-colors ${
            mode === 'write'
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Write
        </button>
        <button
          type="button"
          onClick={() => setMode('preview')}
          className={`px-2.5 py-0.5 rounded text-xs font-medium transition-colors ${
            mode === 'preview'
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Preview
        </button>
        <span className="text-[10px] text-muted-foreground ml-auto">Markdown supported</span>
      </div>

      {mode === 'write' ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[80px] font-mono text-xs leading-relaxed resize-y"
          rows={minRows}
        />
      ) : (
        <div className="min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm">
          {value.trim() ? (
            <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {value}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-muted-foreground text-xs italic">Nothing to preview</p>
          )}
        </div>
      )}
    </div>
  );
}
