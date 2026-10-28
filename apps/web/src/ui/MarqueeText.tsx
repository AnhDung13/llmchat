import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'

/** Khoảng chừa thêm khi chạy tới cuối, để chữ cuối không nằm trong vùng mờ */
const END_GAP = 20
/** Tốc độ chạy (px/giây) */
const SPEED = 40

/**
 * Chữ một dòng: dài quá thì mờ dần ở cuối (thay cho dấu …), rê chuột vào phần tử cha có class
 * `marquee-host` thì chữ chạy sang trái để đọc hết rồi chạy ngược lại. CSS nằm trong index.css (.marquee)
 */
export function MarqueeText({ text }: { text: string }) {
  const outerRef = useRef<HTMLSpanElement>(null)
  const innerRef = useRef<HTMLSpanElement>(null)
  // Số px chữ bị tràn ra ngoài; 0 = vừa khung
  const [overflow, setOverflow] = useState(0)

  useLayoutEffect(() => {
    const outer = outerRef.current
    const inner = innerRef.current
    if (!outer || !inner) return
    const measure = () => setOverflow(Math.max(0, inner.scrollWidth - outer.clientWidth))
    measure()
    // Sidebar thu gọn / cửa sổ đổi kích thước → đo lại
    const observer = new ResizeObserver(measure)
    observer.observe(outer)
    observer.observe(inner)
    return () => observer.disconnect()
  }, [text])

  const distance = overflow + END_GAP
  const style =
    overflow > 0
      ? ({
          '--marquee-distance': `-${distance}px`,
          // 70% thời gian là chạy, 30% còn lại dừng ở hai đầu (xem keyframes marquee)
          '--marquee-duration': `${Math.max(2, distance / SPEED / 0.7)}s`,
        } as CSSProperties)
      : undefined

  return (
    <span ref={outerRef} className="marquee block min-w-0 overflow-hidden whitespace-nowrap" data-overflow={overflow > 0 || undefined} style={style}>
      <span ref={innerRef} className="inline-block">
        {text}
      </span>
    </span>
  )
}
