"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { User, LogIn, LogOut, Settings, BookOpen, CreditCard, CalendarDays } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"

export function AuthNav() {
  const { user, logout, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-muted rounded-full animate-pulse"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link href="/auth/login">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-700 hover:text-foreground hover:bg-muted/50 transition-colors font-medium"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Sign In
          </Button>
        </Link>
        <Link href="/auth/signup">
          <Button
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white glow-effect font-medium"
          >
            <User className="h-4 w-4 mr-2" />
            Sign Up
          </Button>
        </Link>
      </div>
    )
  }

  const getInitials = (email: string, name?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" aria-label="Profile" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600">
            <AvatarFallback className="bg-transparent text-white font-medium">
              {getInitials(user.email, user.name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-card border-input" align="end" forceMount>
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            {user.name && <p className="font-medium text-foreground">{user.name}</p>}
            <p className="w-[200px] truncate text-sm text-slate-600">{user.email}</p>
          </div>
        </div>
        <DropdownMenuSeparator className="bg-gray-700" />
        <DropdownMenuItem asChild><Link href="/progress"><BookOpen className="mr-2 h-4 w-4" />My Progress</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/subscription"><CreditCard className="mr-2 h-4 w-4"/>My Subscription</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/study-plan"><CalendarDays className="mr-2 h-4 w-4"/>My Calendar</Link></DropdownMenuItem>
        <DropdownMenuItem asChild className="text-slate-700 hover:text-foreground hover:bg-muted cursor-pointer"><Link href="/progress">
          <Settings className="mr-2 h-4 w-4" />
          <span>Profile settings</span></Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-gray-700" />
        <DropdownMenuItem className="text-slate-700 hover:text-foreground hover:bg-muted cursor-pointer" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
