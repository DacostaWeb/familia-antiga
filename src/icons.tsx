// Ícones de linha preta, desenhados aqui — sem dependências.
type Props = { tamanho?: number };

function base(tamanho: number) {
  return {
    width: tamanho,
    height: tamanho,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: '#000000',
    strokeWidth: 2,
    strokeLinecap: 'square' as const,
    'aria-hidden': true,
  };
}

export function IconeCasa({ tamanho = 24 }: Props) {
  return (
    <svg {...base(tamanho)}>
      <path d="M4 11 12 4l8 7" />
      <path d="M6 10v10h12V10" />
    </svg>
  );
}

export function IconeNota({ tamanho = 24 }: Props) {
  return (
    <svg {...base(tamanho)}>
      <rect x="5" y="4" width="14" height="16" />
      <path d="M8 9h8M8 13h8M8 17h5" />
    </svg>
  );
}

export function IconePasta({ tamanho = 24 }: Props) {
  return (
    <svg {...base(tamanho)}>
      <path d="M3 6h6l2 3h10v11H3z" />
    </svg>
  );
}

export function IconeDefinicoes({ tamanho = 24 }: Props) {
  return (
    <svg {...base(tamanho)}>
      <path d="M4 8h10M18 8h2M4 16h2M10 16h10" />
      <rect x="14" y="6" width="4" height="4" />
      <rect x="6" y="14" width="4" height="4" />
    </svg>
  );
}

export function IconeMais({ tamanho = 24 }: Props) {
  return (
    <svg {...base(tamanho)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconeLixo({ tamanho = 24 }: Props) {
  return (
    <svg {...base(tamanho)}>
      <path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13" />
    </svg>
  );
}

export function IconeVoltar({ tamanho = 24 }: Props) {
  return (
    <svg {...base(tamanho)}>
      <path d="M14 5l-7 7 7 7" />
    </svg>
  );
}

export function IconeDescarregar({ tamanho = 24 }: Props) {
  return (
    <svg {...base(tamanho)}>
      <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
    </svg>
  );
}

export function IconeAnexar({ tamanho = 24 }: Props) {
  return (
    <svg {...base(tamanho)}>
      <path d="M12 18V6M7 11l5-5 5 5" />
      <path d="M5 20h14" />
    </svg>
  );
}

export function IconeAmpulheta({ tamanho = 24 }: Props) {
  return (
    <svg {...base(tamanho)}>
      <path d="M7 4h10M7 20h10M8 4c0 4 8 4 8 8s-8 4-8 8" />
      <path d="M16 4c0 4-8 4-8 8s8 4 8 8" />
    </svg>
  );
}
