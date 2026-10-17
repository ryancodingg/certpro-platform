"use client"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
export function AdminLink() {const {isOwner}=useAuth();return isOwner?<Link href="/admin" className="underline">Admin Panel</Link>:null}
