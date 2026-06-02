import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface ComboboxOption {
  value: string;
  label?: string;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (next: string) => void;
  /** When set, allows the user to add a new value not in `options`. */
  onCreate?: (next: string) => Promise<void> | void;
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  onCreate,
  placeholder = "Select…",
  emptyText = "Nothing found.",
  disabled,
  className,
}: Readonly<ComboboxProps>) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  const normalizedSearch = search.trim();
  const matches = options.filter(o =>
    (o.label ?? o.value).toLowerCase().includes(normalizedSearch.toLowerCase()),
  );
  const exact = options.some(
    o => (o.label ?? o.value).toLowerCase() === normalizedSearch.toLowerCase(),
  );
  const showCreate = !!onCreate && normalizedSearch.length > 0 && !exact;

  const handleCreate = async () => {
    if (!onCreate || !normalizedSearch) return;
    setCreating(true);
    try {
      await onCreate(normalizedSearch);
      onChange(normalizedSearch);
      setSearch("");
      setOpen(false);
    } finally {
      setCreating(false);
    }
  };

  const displayLabel =
    options.find(o => o.value === value)?.label ?? value ?? "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between font-normal", className)}
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {displayLabel || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search or add…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {matches.length === 0 && !showCreate && (
              <CommandEmpty>{emptyText}</CommandEmpty>
            )}
            {matches.length > 0 && (
              <CommandGroup>
                {matches.map(opt => (
                  <CommandItem
                    key={opt.value}
                    value={opt.value}
                    onSelect={(v) => {
                      onChange(v);
                      setSearch("");
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === opt.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {opt.label ?? opt.value}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {showCreate && (
              <CommandGroup heading="Create new">
                <CommandItem
                  disabled={creating}
                  onSelect={handleCreate}
                  className="text-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {creating ? "Adding…" : `Add "${normalizedSearch}"`}
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
