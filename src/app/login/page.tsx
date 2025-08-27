'use client';

import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
           <AuthForm />
        </div>
    );
}
