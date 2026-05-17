import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-zinc-800/70",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
