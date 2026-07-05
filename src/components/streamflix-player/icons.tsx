interface IconProps {
  size?: number
  className?: string
}

export function Replay10({ size = 24, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="currentColor"
    >
      <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
      <text
        x="12" y="16"
        textAnchor="middle"
        fill="currentColor"
        stroke="none"
        fontSize="7"
        fontWeight="700"
      >
        10
      </text>
    </svg>
  )
}

export function Forward10({ size = 24, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="currentColor"
    >
      <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" />
      <text
        x="12" y="16"
        textAnchor="middle"
        fill="currentColor"
        stroke="none"
        fontSize="7"
        fontWeight="700"
      >
        10
      </text>
    </svg>
  )
}
