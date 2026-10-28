import { code } from '@streamdown/code'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Streamdown, type StreamdownTranslations } from 'streamdown'

// Streamdown thay cho react-markdown: tự đóng tạm markdown dở dang khi đang stream (không lộ `**`,
// khối ``` chưa đóng không nuốt phần sau), chỉ render lại block cuối, tô màu code bằng Shiki.
const plugins = { code }
// Bảng không có nút nào; khối code chỉ giữ nút copy, bỏ nút tải file
const controls = { table: false, code: { copy: true, download: false } }

type Props = {
  text: string
  /** Đang nhận chữ: hiện chấm tròn ở cuối và hiệu ứng chữ hiện dần */
  streaming?: boolean
}

export const Markdown = memo(function Markdown({ text, streaming = false }: Props) {
  const { t } = useTranslation('thread')
  // Chữ trên nút copy, hộp thoại mở link... của Streamdown: locales/<lang>/thread.json → markdown
  const translations = useMemo(() => t('markdown', { returnObjects: true }) as Partial<StreamdownTranslations>, [t])

  return (
    <Streamdown
      plugins={plugins}
      isAnimating={streaming}
      animated
      caret="circle"
      translations={translations}
      controls={controls}
      // 0 = không giới hạn chiều cao (mặc định code 400px, bảng 300px rồi cuộn bên trong)
      codeBlockMaxHeight={0}
      tableMaxHeight={0}
      className="text-base leading-7"
    >
      {text}
    </Streamdown>
  )
})
