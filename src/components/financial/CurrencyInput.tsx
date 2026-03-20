
import React, { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  id?: string;
  className?: string;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({ value, onChange, id, className }) => {
  const [displayValue, setDisplayValue] = useState(value ? formatCurrency(value) : '');
  const inputRef = useRef<HTMLInputElement>(null);

  function formatCurrency(val: number): string {
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function parseCurrency(str: string): number {
    const cleaned = str.replace(/[^\d,.-]/g, '').replace('.', '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  const handleFocus = () => {
    if (value === 0) {
      setDisplayValue('');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDisplayValue(raw);
    const parsed = parseCurrency(raw);
    onChange(parsed);
  };

  const handleBlur = () => {
    const parsed = parseCurrency(displayValue);
    setDisplayValue(parsed > 0 ? formatCurrency(parsed) : '');
    onChange(parsed);
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">R$</span>
      <Input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="0,00"
        className={`pl-10 bg-background/80 ${className || ''}`}
      />
    </div>
  );
};

export default CurrencyInput;
