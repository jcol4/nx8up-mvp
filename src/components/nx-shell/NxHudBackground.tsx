export default function NxHudBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10"
      style={{
        backgroundColor: '#08101c',
        backgroundImage:
          'linear-gradient(rgb(3 6 12 / 4%), rgb(3 6 12 / 18%)), radial-gradient(ellipse 85% 45% at 50% 100%, rgb(153 247 255 / 8%), transparent 70%), url("/nx8up-bg-v2.svg"), linear-gradient(rgb(153 247 255 / 1.35%) 1px, transparent 1px), linear-gradient(90deg, rgb(153 247 255 / 1.35%) 1px, transparent 1px)',
        backgroundSize: 'cover, cover, cover, 40px 40px, 40px 40px',
        backgroundPosition: 'center, center bottom, center, 0 0, 0 0',
        backgroundRepeat: 'no-repeat, no-repeat, no-repeat, repeat, repeat',
        backgroundAttachment: 'scroll',
      }}
    />
  )
}
