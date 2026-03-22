import { ComponentProps } from "react";
import { Logo3D } from "./Logo3D";

export function Logo({ className, ...props }: ComponentProps<"div">) {
  return (
    <div className={`flex items-center gap-2 ${className}`} {...props}>
      <div className="relative w-10 h-10 flex items-center justify-center">
        <Logo3D className="w-full h-full" />
      </div>
      <span className="font-display font-bold tracking-tight text-[var(--text-primary)] text-xl">
        FEC<span className="text-[var(--accent-green)]">VSM</span>
      </span>
    </div>
  );
}
