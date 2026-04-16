import { useState, useRef, useEffect } from 'react';

/**
 * Input de moeda com máscara brasileira: 1.500,00
 * - `value` recebe o valor numérico (string ou number), ex: "1500.50" ou 1500.50
 * - `onChange` é chamado com evento sintético { target: { value: "1500.50" } }
 * - Aceita as mesmas classes/props de um <input />
 */
export default function CurrencyInput({ value, onChange, className, placeholder = '0,00', ...props }) {
  const toDisplay = (raw) => {
    const num = parseFloat(String(raw).replace(',', '.'));
    if (isNaN(num)) return '';
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const toRaw = (display) => {
    // Remove pontos de milhar, troca vírgula por ponto
    const clean = display.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(clean);
    return isNaN(num) ? '' : String(num);
  };

  const [display, setDisplay] = useState(() => toDisplay(value));
  const skipSync = useRef(false);

  // Sincroniza quando o valor externo muda (ex: reset do form)
  useEffect(() => {
    if (skipSync.current) { skipSync.current = false; return; }
    setDisplay(toDisplay(value));
  }, [value]);

  const handleChange = (e) => {
    // Permite apenas dígitos, vírgula e ponto
    let raw = e.target.value.replace(/[^\d,]/g, '');

    // Só uma vírgula permitida
    const parts = raw.split(',');
    if (parts.length > 2) raw = parts[0] + ',' + parts.slice(1).join('');

    // Limita casas decimais a 2
    if (parts[1]?.length > 2) raw = parts[0] + ',' + parts[1].slice(0, 2);

    // Formata a parte inteira com pontos de milhar
    const intPart = parts[0].replace(/\D/g, '');
    const formatted = intPart
      ? Number(intPart).toLocaleString('pt-BR') + (raw.includes(',') ? ',' + (parts[1] || '') : '')
      : raw.includes(',') ? '0,' + (parts[1] || '') : '';

    skipSync.current = true;
    setDisplay(formatted);
    onChange?.({ target: { value: toRaw(formatted) } });
  };

  const handleBlur = () => {
    // Ao sair do campo, formata com 2 casas decimais
    const raw = toRaw(display);
    setDisplay(raw ? toDisplay(raw) : '');
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      className={className}
      value={display}
      placeholder={placeholder}
      onChange={handleChange}
      onBlur={handleBlur}
      {...props}
    />
  );
}
