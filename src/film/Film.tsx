export function Film({ onDone }: { onDone: () => void }) {
  return (
    <div style={{ color: 'white', padding: 40 }}>
      Film coming soon. <button onClick={onDone}>Skip</button>
    </div>
  );
}
