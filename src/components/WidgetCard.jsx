export default function WidgetCard({ title, children }) {
  return (
    <div className="bg-white shadow rounded-lg p-4 flex items-center justify-center">
      {children || <span className="text-gray-400">{title} Placeholder</span>}
    </div>
  );
}
