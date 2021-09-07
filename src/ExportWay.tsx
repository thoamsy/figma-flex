export const supportWays = ['css', 'camelCase', 'emotion', 'tailwind'] as const;
export type SupportWays = typeof supportWays[number];

const Radio = ({
  label,
  value,
  onChange,
  name,
}: {
  name: string;
  label: string;
  value: SupportWays;
  onChange: (val: SupportWays) => void;
}) => (
  <div>
    <label>
      <input
        type="radio"
        className="mr-1"
        checked={value === name}
        onChange={() => onChange(name as SupportWays)}
        name={name}
      />
      {label}
    </label>
  </div>
);

const ExportWay = ({
  value,
  onChange,
}: {
  value: SupportWays;
  onChange: (val: SupportWays) => void;
}) => (
  <fieldset className="flex flex-wrap gap-2">
    <legend className="text-sm">选出符合你偏好的风格</legend>
    {supportWays.map((way) => (
      <Radio
        label={way}
        value={value}
        onChange={onChange}
        key={way}
        name={way}
      />
    ))}
  </fieldset>
);
export default ExportWay;
