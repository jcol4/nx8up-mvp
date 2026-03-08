/**
 * Component structure (see FRONTEND.md):
 *
 * - layout/   – Auth and global layout (AuthLayout, ConditionalHeader)
 * - ui/       – Shared UI primitives (TabBar, ProgressBar, SecondaryButton, NXDatePicker)
 * - shared/   – Cross-role shared (Logo, UserProfileBlock)
 * - dashboard/ – Dashboard building blocks (DashboardPanel, NavItem, etc.)
 * - creator/  – Creator-specific (CreatorTopBar)
 */

export { AuthLayout, ConditionalHeader } from './layout'
export { TabBar, ProgressBar, SecondaryButton, NXDatePicker } from './ui'
export { Logo, UserProfileBlock } from './shared'
export {
  DashboardPanel,
  StatCard,
  DashboardLogo,
  NavItem,
  UserAvatar,
  CardWithImage,
  InsightRow,
} from './dashboard'
export { default as CreatorTopBar } from './creator/CreatorTopBar'
