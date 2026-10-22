import { CheckIcon, CopyIcon } from 'lucide-react'
import { memo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

const components: Components = {
  pre({ node, children }) {
    // ```js → <pre><code class="language-js">; lấy tên ngôn ngữ để hiện ở đầu khối code
    const code = node?.children[0]
    const className = code?.type === 'element' ? code.properties.className : undefined
    const lang = Array.isArray(className)
      ? className.map(String).find((c) => c.startsWith('language-'))?.slice('language-'.length)
      : undefined
    return <CodeBlock lang={lang}>{children}</CodeBlock>
  },
  a({ href, children }) {
    return (
      <a href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    )
  },
}

function CodeBlock({ lang, children }: { lang?: string; children: ReactNode }) {
  const { t } = useTranslation('thread')
  const [copied, setCopied] = useState(false)
  return (
    <div className="not-prose my-4 overflow-hidden rounded-xl border border-slate-800 bg-[#0d1224] dark:border-night-700 dark:bg-night-950">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-1.5 text-xs text-slate-400">
        <span>{lang ?? t('code')}</span>
        <button
          type="button"
          onClick={(e) => {
            const text = e.currentTarget.closest('.not-prose')?.querySelector('pre')?.innerText ?? ''
            void navigator.clipboard.writeText(text).then(() => {
              setCopied(true)
              setTimeout(() => setCopied(false), 1500)
            })
          }}
          className="flex items-center gap-1.5 rounded-md px-1.5 py-1 transition hover:bg-white/5 hover:text-slate-100"
        >
          {copied ? <CheckIcon size={13} /> : <CopyIcon size={13} />}
          {t(copied ? 'copied' : 'copyCode')}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-slate-100">{children}</pre>
    </div>
  )
}

export const Markdown = memo(function Markdown({ text }: { text: string }) {
  return (
    <div className="prose prose-slate max-w-none text-[15px] dark:prose-invert prose-headings:font-semibold prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-code:rounded prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:font-normal prose-code:before:content-none prose-code:after:content-none dark:prose-code:bg-night-800">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {text}
      </ReactMarkdown>
    </div>
  )
})
