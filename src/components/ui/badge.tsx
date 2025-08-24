export default function Badge({ label }: { label: string }) {
  return <span className="bg-green-500 text-white px-2 py-1 rounded">{label}</span>;
}