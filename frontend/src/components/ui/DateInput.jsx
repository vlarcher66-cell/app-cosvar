import { useRef } from 'react';

/**
 * Input de data que abre o calendário nativo ao clicar em qualquer parte do campo.
 * Aceita as mesmas props de um <input type="date" />.
 */
export default function DateInput({ className, ...props }) {
  const ref = useRef(null);

  const handleClick = () => {
    try { ref.current?.showPicker(); } catch (_) {}
  };

  return (
    <input
      ref={ref}
      type="date"
      className={className}
      onClick={handleClick}
      {...props}
    />
  );
}
