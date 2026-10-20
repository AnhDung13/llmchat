import { memo, useState, type ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

const components: Components = {
  pre({ children }) {
    return <CodeBlock>{children}</CodeBlock>
  },
  a({ href, children }) {
    return (
      <a href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    )
  },
}

function CodeBlock({ children }: { children: ReactNode }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="group relative">
      <pre>{children}</pre>
      <button
        type="button"
        onClick={(e) => {
          const text = e.currentTarget.parentElement?.querySelector('pre')?.innerText ?? ''
          void navigator.clipboard.writeText(text).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          })
        }}
        className="absolute top-2 right-2 rounded-md bg-zinc-700/80 px-2 py-1 text-xs text-zinc-100 opacity-0 transition group-hover:opacity-100 focus:opacity-100"
      >
        {copied ? 'Đã chép' : 'Chép'}
      </button>
    </div>
  )
}

export const Markdown = memo(function Markdown({ text }: { text: string }) {
  return (
    <div className="prose prose-zinc max-w-none dark:prose-invert prose-pre:bg-zinc-900 prose-pre:text-zinc-100 prose-code:before:content-none prose-code:after:content-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {text}
      </ReactMarkdown>
    </div>
  )
})
