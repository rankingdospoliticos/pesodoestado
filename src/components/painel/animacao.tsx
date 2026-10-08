import { useEffect, useRef, useState } from "react";

/**
 * Animações de entrada.
 *
 * O servidor sempre entrega o conteúdo pronto (sem animação), para quem não roda
 * JavaScript e para os buscadores. No navegador, o que ainda está abaixo da dobra
 * fica "em espera" e anima ao aparecer na tela. Quem pediu menos movimento no
 * sistema operacional vê tudo estático.
 */
export type Revelar = "" | "espera" | "visto";

const menosMovimento = () =>
  typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

export function useRevelar<T extends Element>(margem = 0.12) {
  const ref = useRef<T | null>(null);
  const [estado, setEstado] = useState<Revelar>("");
  useEffect(() => {
    const el = ref.current;
    if (!el || menosMovimento() || typeof IntersectionObserver === "undefined") return;
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * (1 - margem) && r.bottom > 0) return; // já visível: fica estático
    setEstado("espera");
    const io = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          setEstado("visto");
          io.disconnect();
        }
      },
      { rootMargin: `0px 0px -${Math.round(margem * 100)}% 0px` },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [margem]);
  return [ref, estado] as const;
}

const suave = (t: number) => 1 - Math.pow(1 - t, 3);

/** Número que conta de zero até o valor quando entra na tela. */
export function Contador({ valor, formato, duracao = 1400 }: { valor: number; formato: (n: number) => string; duracao?: number }) {
  const [ref, estado] = useRevelar<HTMLSpanElement>();
  const [n, setN] = useState(valor);
  useEffect(() => {
    if (estado === "espera") setN(0);
    if (estado !== "visto") return;
    let raf = 0;
    const t0 = performance.now();
    const passo = (t: number) => {
      const k = Math.min(1, (t - t0) / duracao);
      setN(valor * suave(k));
      if (k < 1) raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [estado, valor, duracao]);
  // se o valor mudar depois (dados novos chegando), mostra o novo direto
  useEffect(() => {
    if (estado === "") setN(valor);
  }, [valor, estado]);
  return <span ref={ref} className="num">{formato(n)}</span>;
}

/** Variante que reanima sempre que o valor muda (ex.: troca de opção pelo usuário). */
export function ContadorVivo({ valor, formato, duracao = 900 }: { valor: number; formato: (n: number) => string; duracao?: number }) {
  const [n, setN] = useState(valor);
  const anterior = useRef(valor);
  useEffect(() => {
    if (menosMovimento()) {
      setN(valor);
      anterior.current = valor;
      return;
    }
    const de = anterior.current;
    anterior.current = valor;
    if (de === valor) return;
    let raf = 0;
    const t0 = performance.now();
    const passo = (t: number) => {
      const k = Math.min(1, (t - t0) / duracao);
      setN(de + (valor - de) * suave(k));
      if (k < 1) raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [valor, duracao]);
  return <span className="num">{formato(n)}</span>;
}
