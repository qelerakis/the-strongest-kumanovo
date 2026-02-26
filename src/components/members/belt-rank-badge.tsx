import { BELT_COLORS, type BeltRank } from "@/types";

interface BeltRankBadgeProps {
  rank: BeltRank;
  className?: string;
}

export default function BeltRankBadge({
  rank,
  className = "",
}: BeltRankBadgeProps) {
  const color = BELT_COLORS[rank];
  const isWhite = rank === "white";

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        className="block h-3 w-8 rounded-sm"
        style={{
          backgroundColor: color,
          border: isWhite ? "1px solid #525252" : "none",
        }}
      />
    </div>
  );
}
