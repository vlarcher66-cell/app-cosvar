/**
 * Formulário genérico para cadastros com campos simples
 * fields: [{ name, label, type, required, options }]
 */
import { useState } from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import s from './SimpleForm.module.css';

export default function SimpleForm({ fields, initial, onSave, saving, onCancel }) {
  const [form, setForm] = useState(() => {
    const init = {};
    fields.forEach(f => { init[f.name] = initial?.[f.name] ?? (f.default ?? ''); });
    return init;
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    fields.forEach(f => {
      if (f.required && !form[f.name]) e[f.name] = 'Campo obrigatório';
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(form);
  };

  const set = (name, value) => setForm(p => ({ ...p, [name]: value }));

  return (
    <form onSubmit={handleSubmit} className={s.form}>
      {fields.map(f => {
        if (f.type === 'select') {
          return (
            <Select
              key={f.name}
              label={f.label}
              value={form[f.name]}
              onChange={e => set(f.name, e.target.value)}
              error={errors[f.name]}
            >
              <option value="">Selecione...</option>
              {(f.options || []).map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          );
        }
        if (f.type === 'textarea') {
          return (
            <div key={f.name} className={s.field}>
              <label className={s.label}>{f.label}</label>
              <textarea
                className={s.textarea}
                value={form[f.name]}
                onChange={e => set(f.name, e.target.value)}
                rows={3}
              />
              {errors[f.name] && <span className={s.error}>{errors[f.name]}</span>}
            </div>
          );
        }
        return (
          <Input
            key={f.name}
            label={f.label}
            type={f.type || 'text'}
            value={form[f.name]}
            onChange={e => set(f.name, e.target.value)}
            error={errors[f.name]}
            placeholder={f.placeholder}
          />
        );
      })}
      <div className={s.actions}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>Cancelar</Button>
        <Button type="submit" variant="primary" loading={saving}>Salvar</Button>
      </div>
    </form>
  );
}
