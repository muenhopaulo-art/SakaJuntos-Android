
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LogIn } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold font-headline">Entrar</CardTitle>
          <CardDescription>
            Use o seu email e telefone para aceder à sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="seuemail@exemplo.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" type="tel" placeholder="O seu número de telefone" required />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full">
            <LogIn className="mr-2 h-4 w-4" /> Entrar
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Ainda não tem conta?{" "}
            <Link href="#" className="underline hover:text-primary">
              Crie uma aqui
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
