'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { seedDatabase } from '@/services/product-service';

export default function SeedPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSeed = async () => {
    setLoading(true);
    setMessage('');
    const result = await seedDatabase();
    setMessage(result.message);
    setLoading(false);
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Popular Base de Dados</CardTitle>
          <CardDescription>
            Clique no botão abaixo para adicionar os produtos e promoções iniciais à sua base de dados do Firestore.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSeed} disabled={loading} className="w-full">
            {loading ? 'A popular...' : 'Popular Base de Dados'}
          </Button>
          {message && (
            <p className="mt-4 text-center text-sm text-muted-foreground">{message}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
