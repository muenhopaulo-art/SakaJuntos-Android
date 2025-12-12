import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // 1. Inicializamos como FALSE (o valor que o servidor assume).
  // Isso garante que a primeira renderização do cliente corresponda ao SSR.
  const [isMobile, setIsMobile] = React.useState<boolean>(false)
  
  // 2. Usamos um estado para saber se o componente já montou no lado do cliente.
  const [hasMounted, setHasMounted] = React.useState(false)

  React.useEffect(() => {
    // 3. O componente montou: agora podemos confiar no DOM e no objeto window.
    setHasMounted(true) 
    
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // 4. Aplicamos o valor real do dispositivo imediatamente após a montagem.
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT) 
    
    mql.addEventListener("change", onChange)
    
    return () => mql.removeEventListener("change", onChange)
  }, [])
  
  // 5. Se o componente ainda não montou (ou seja, está em SSR ou na 1ª renderização do cliente),
  // retornamos false, que é o valor que o servidor usou.
  // Depois de montado, retornamos o valor real (isMobile).
  return hasMounted ? isMobile : false
}
