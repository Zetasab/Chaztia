import { memo } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

const components: Components = {
  p: ({ children }) => <p className="whitespace-pre-wrap last:mb-0 mb-2">{children}</p>,
  ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="underline underline-offset-2 hover:text-primary"
    >
      {children}
    </a>
  ),
  code: ({ className, children, ...props }) => {
    const isInline = !className
    if (isInline) {
      return (
        <code
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]"
          {...props}
        >
          {children}
        </code>
      )
    }

    const language = /language-(\w+)/.exec(className ?? '')?.[1]

    return (
      <div className="my-2 overflow-hidden rounded-lg border bg-muted first:mt-0 last:mb-0">
        {language && (
          <div className="border-b bg-muted px-3 py-1 font-mono text-xs text-muted-foreground">
            {language}
          </div>
        )}
        <pre className="overflow-x-auto p-3">
          <code className={cn('font-mono text-xs', className)} {...props}>
            {children}
          </code>
        </pre>
      </div>
    )
  },
}

interface ChatMarkdownProps {
  content: string
  className?: string
}

export const ChatMarkdown = memo(function ChatMarkdown({
  content,
  className,
}: ChatMarkdownProps) {
  return (
    <div className={cn('text-sm', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
})
