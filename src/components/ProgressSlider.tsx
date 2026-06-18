interface ProgressSliderProps {
  name?: string;
  value: number;
  onChange: (value: number) => void;
  label?: string;
}

export default function ProgressSlider({
  name = "progress",
  value,
  onChange,
  label = "진행률",
}: ProgressSliderProps) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <label className="font-medium text-zinc-700">{label}</label>
        <span className="tabular-nums text-zinc-500">{value}%</span>
      </div>
      <input
        name={name}
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-brand-600"
      />
    </div>
  );
}
