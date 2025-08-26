import { ShoppingCart } from "lucide-react";

export function SiteFooter() {
    return (
      <footer className="py-6 md:px-8 md:py-0 border-t">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="h-6 w-6" />
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              © {new Date().getFullYear()} SakaJuntos Web. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    );
  }
  