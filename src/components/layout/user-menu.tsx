"use client"

import { LogOut, Settings, User as UserIcon, ChevronsUpDown } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth/auth-context"
import { CURRENT_WORKSPACE } from "@/lib/data/workspace"
import { cn } from "@/lib/utils"

function initialsFor(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

interface UserMenuProps {
  variant?: "sidebar" | "header"
  className?: string
}

export function UserMenu({ variant = "header", className }: UserMenuProps) {
  const { user, logout } = useAuth()

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center gap-2 rounded-lg text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          variant === "sidebar" &&
            "h-11 w-full px-2 hover:bg-sidebar-accent/60 data-[popup-open]:bg-sidebar-accent/60",
          variant === "header" && "h-8 px-1 hover:bg-muted data-[popup-open]:bg-muted",
          className
        )}
      >
        <Avatar size={variant === "sidebar" ? "default" : "sm"}>
          <AvatarFallback>{initialsFor(user.name)}</AvatarFallback>
        </Avatar>
        {variant === "sidebar" && (
          <>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium text-sidebar-foreground">{user.name}</span>
              <span className="truncate text-xs text-sidebar-foreground/55">{CURRENT_WORKSPACE.name}</span>
            </div>
            <ChevronsUpDown className="size-3.5 shrink-0 text-sidebar-foreground/45" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={variant === "sidebar" ? "start" : "end"} className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5 px-1.5 py-1.5">
            <span className="text-sm font-medium text-foreground">{user.name}</span>
            <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <UserIcon />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings />
            Workspace settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => logout()}>
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
