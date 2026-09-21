import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type MemberOption = { id: string; displayName: string };

export function AssigneeSelect({
  members,
  value,
  onChange,
  label,
  disabled,
  className,
}: {
  members: MemberOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}) {
  const select = (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={className ?? "h-9"}>
        <SelectValue placeholder="Unassigned" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassigned">Unassigned</SelectItem>
        {members.map((member) => (
          <SelectItem key={member.id} value={member.id}>
            {member.displayName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  if (!label) return select;

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {select}
    </div>
  );
}
