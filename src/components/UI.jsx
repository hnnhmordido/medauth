export function PrimaryButton({ children, onClick, type = "button", disabled = false }) {
  return <button className="btn btn-primary" type={type} onClick={onClick} disabled={disabled}>{children}</button>;
}

export function SecondaryButton({ children, onClick, type = "button" }) {
  return <button className="btn btn-secondary" type={type} onClick={onClick}>{children}</button>;
}

export function NetworkBadge({ offline }) {
  return <span className={`network-badge ${offline ? "offline" : "online"}`}>{offline ? "● Offline" : "● Online"}</span>;
}

export function StatusCard({ status, title, text }) {
  const icon = status === "MATCH" ? "✓" : status === "NO_MATCH" ? "!" : "?";
  return (
    <div className={`status-card ${status.toLowerCase()}`}>
      <div className="status-icon" aria-hidden="true">{icon}</div>
      <div>
        <div className="eyebrow">Verification result</div>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
    </div>
  );
}
