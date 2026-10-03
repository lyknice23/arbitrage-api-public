/** Marks a panel whose data is still sample/mock until the backend provides it. */
export default function SamplePill() {
  return (
    <span
      className="rounded-md border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300"
      title="Sample data — this panel becomes live once the backend provides it"
    >
      sample
    </span>
  );
}
