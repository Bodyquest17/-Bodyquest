
import {
  Home,
  Swords,
  Trophy,
  Medal,
  TrendingUp,
  User,
  LayoutDashboard,
  Flag,
  Users,
  BarChart3,
  Settings,
  CreditCard,
} from "lucide-react";

export const memberNav = [
  { href: "/dashboard", label: "Start", icon: Home },
  { href: "/quests", label: "Quests", icon: Swords },
  { href: "/challenges", label: "Challenges", icon: Trophy },
  { href: "/leaderboard", label: "Rangliste", icon: Medal },
  { href: "/fortschritt", label: "Fortschritt", icon: TrendingUp },
  { href: "/profil", label: "Profil", icon: User },
] as const;

export const adminNav = [
  { href: "/admin", label: "Übersicht", icon: LayoutDashboard },
  { href: "/admin/quests", label: "Quests", icon: Swords },
  { href: "/admin/challenges", label: "Challenges", icon: Flag },
  { href: "/admin/mitglieder", label: "Mitglieder", icon: Users },
  { href: "/admin/statistiken", label: "Statistiken", icon: BarChart3 },
  { href: "/admin/einstellungen", label: "Einstellungen", icon: Settings },
  { href: "/admin/mitgliedschaften", label: "Mitgliedschaften", icon: CreditCard },
] as const;
