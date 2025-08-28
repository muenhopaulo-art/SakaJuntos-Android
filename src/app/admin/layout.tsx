
'use client'

import { SidebarProvider, Sidebar, SidebarTrigger, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarHeader, SidebarContent, SidebarInset } from '@/components/ui/sidebar';
import { Home, Package, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();

  const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: Home },
    { href: '/admin/orders', label: 'Pedidos', icon: Package },
    // { href: '/admin/users', label: 'Utilizadores', icon: Users },
  ];

  return (
    <SidebarProvider>
        <Sidebar>
            <SidebarContent>
                <SidebarHeader>
                    <h2 className="text-lg font-semibold p-2 group-data-[collapsible=icon]:hidden">Admin</h2>
                    <SidebarTrigger className="group-data-[collapsible=icon]:hidden"/>
                </SidebarHeader>
                <SidebarMenu>
                    {menuItems.map(item => (
                         <SidebarMenuItem key={item.href}>
                             <Link href={item.href}>
                                <SidebarMenuButton tooltip={item.label} isActive={pathname === item.href}>
                                     <item.icon/>
                                     <span>{item.label}</span>
                                </SidebarMenuButton>
                             </Link>
                         </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
        </Sidebar>
        <SidebarInset>
             {children}
        </SidebarInset>
    </SidebarProvider>
  )
}
