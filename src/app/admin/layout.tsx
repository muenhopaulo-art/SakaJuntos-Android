
'use client'

import { SidebarProvider, Sidebar, SidebarTrigger, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarHeader, SidebarContent, SidebarInset, SidebarFooter } from '@/components/ui/sidebar';
import { Home, Package, LogOut, Users, Megaphone } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, updateDoc } from 'firebase/firestore';


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user] = useAuthState(auth);

  const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: Home },
    { href: '/admin/orders', label: 'Pedidos', icon: Package },
    { href: '/admin/products', label: 'Produtos', icon: Package },
    { href: '/admin/users', label: 'Utilizadores', icon: Users },
    { href: '/admin/promotions', label: 'Promoções', icon: Megaphone },
  ];
  
  const handleLogout = async () => {
    if (user) {
        await updateDoc(doc(db, "users", user.uid), { online: false });
    }
    await auth.signOut();
    router.push('/login');
  }

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
             <SidebarFooter>
                 <SidebarMenu>
                     <SidebarMenuItem>
                        <SidebarMenuButton tooltip="Sair" onClick={handleLogout}>
                            <LogOut />
                            <span>Sair</span>
                        </SidebarMenuButton>
                     </SidebarMenuItem>
                 </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
        <SidebarInset>
             {children}
        </SidebarInset>
    </SidebarProvider>
  )
}
