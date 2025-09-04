import React from "react"; 
import { Input } from "../inputs/Input";
import Button from "../buttons/buttons";

type Props = {
  options: string[];
  onChange: (newOptions: string[]) => void;
  maxOptions?: number;
};

const OptionsManager: React.FC<Props> = ({
  options,
  onChange,
  maxOptions = 20,
}) => {
  const handleChange = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    onChange(updated);
  };

  const handleAdd = () => {
    if (options.length >= maxOptions) return;
    onChange([...options, ""]);
  };

  const handleRemove = (index: number) => {
    const updated = options.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {options.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            type="text"
            placeholder={`Opción ${i + 1}`}
            value={opt}
            onChange={(e) => handleChange(i, e.target.value)}
            size="sm"
            tone="strong"
          />
          <Button
            onClick={() => handleRemove(i)}
            variant="cancel"
            label={""}
          />
        </div>
      ))}
      {options.length < maxOptions && (
        <Button onClick={handleAdd} variant="create" label="Agregar opción" />
      )}
    </div>
  );
};

export default OptionsManager;
