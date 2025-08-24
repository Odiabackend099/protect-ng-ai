export default function Card({ children }: { children: React.ReactNode }) {
  return <div className="border rounded shadow p-4">{children}</div>;
}