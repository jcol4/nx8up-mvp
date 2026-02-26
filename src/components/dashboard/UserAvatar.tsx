type Props = {
  src?: string | null
  name?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_CLASS = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
}

export default function UserAvatar({ src, name, size = 'md', className = '' }: Props) {
  const sizeClass = SIZE_CLASS[size]
  const initial = name ? name.charAt(0).toUpperCase() : '?'

  return (
    <div
      className={`${sizeClass} rounded-full overflow-hidden flex-shrink-0 dash-avatar ${className}`}
    >
      {src ? (
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center dash-avatar-fallback">
          {initial}
        </div>
      )}
    </div>
  )
}
