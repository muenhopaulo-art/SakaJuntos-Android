
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Bell, Loader2, Trash2 } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import type { Notification } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { collection, query, onSnapshot, orderBy, writeBatch, getDocs, doc } from 'firebase/firestore';
import Link from 'next/link';

function NotificationItem({ notification, onRead }: { notification: Notification, onRead: (id: string) => void }) {
    return (
        <Link
            href={notification.link}
            onClick={() => onRead(notification.id)}
            className={cn(
                "block p-4 rounded-lg border text-card-foreground shadow-sm transition-colors hover:bg-muted/50",
                !notification.isRead && "bg-primary/10 border-primary/20"
            )}
        >
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-semibold text-sm">{notification.title}</h3>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                </div>
                {!notification.isRead && <span className="h-2 w-2 rounded-full bg-primary mt-1"></span>}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: pt })}
            </p>
        </Link>
    )
}

export function NotificationsSheet() {
  const [user] = useAuthState(auth);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) {
        setNotifications([]);
        setLoading(false);
        return;
    }

    setLoading(true);
    const notificationsQuery = query(collection(db, 'users', user.uid, 'notifications'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
        const fetchedNotifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toMillis() || Date.now(),
        } as Notification));
        setNotifications(fetchedNotifications);
        setLoading(false);
    }, (err) => {
        console.error("Error fetching notifications:", err);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    if (!user) return;
    const notificationRef = doc(db, 'users', user.uid, 'notifications', notificationId);
    await writeBatch(db).update(notificationRef, { isRead: true }).commit();
  };

  const handleClearAll = async () => {
    if (!user || notifications.length === 0) return;
    const batch = writeBatch(db);
    const notificationsCol = collection(db, 'users', user.uid, 'notifications');
    const snapshot = await getDocs(notificationsCol);
    snapshot.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }

  const handleSheetOpen = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && user && unreadCount > 0) {
        const batch = writeBatch(db);
        notifications.forEach(n => {
            if (!n.isRead) {
                const notifRef = doc(db, 'users', user.uid, 'notifications', n.id);
                batch.update(notifRef, { isRead: true });
            }
        });
        await batch.commit();
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleSheetOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px]">
              {unreadCount}
            </span>
          )}
          <span className="sr-only">Abrir Notificações</span>
        </Button>
      </SheetTrigger>
       <SheetContent className="flex w-full flex-col pr-0 sm:max-w-md">
        <SheetHeader className="px-6">
            <SheetTitle>Notificações</SheetTitle>
            <SheetDescription>
                Acompanhe as últimas atualizações.
            </SheetDescription>
        </SheetHeader>
        <Separator />
        <ScrollArea className="flex-1">
            <div className="flex flex-col gap-3 px-6 py-4">
                {loading ? (
                    <div className="flex items-center justify-center h-full pt-20">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : notifications.length > 0 ? (
                    notifications.map(notification => 
                        <NotificationItem key={notification.id} notification={notification} onRead={handleMarkAsRead}/>
                    )
                ) : (
                    <div className="text-center pt-20 text-muted-foreground space-y-4">
                        <Bell className="h-12 w-12 mx-auto" />
                        <p className="font-semibold">Nenhuma notificação por agora.</p>
                        <p className="text-sm">As atualizações importantes aparecerão aqui.</p>
                    </div>
                )}
            </div>
        </ScrollArea>
        {notifications.length > 0 && (
            <SheetFooter className="px-6 py-3 border-t">
                <Button variant="ghost" size="sm" onClick={handleClearAll}>
                    <Trash2 className="mr-2"/> Limpar Tudo
                </Button>
            </SheetFooter>
        )}
       </SheetContent>
    </Sheet>
  );
}
