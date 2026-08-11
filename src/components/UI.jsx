export function PrimaryButton({
  children,
  onClick,
  type = "button",
  disabled = false,
}) {
  return (
    <button
      className="btn btn-primary"
      type={type}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  type = "button",
  disabled = false,
}) {
  return (
    <button
      className="btn btn-secondary"
      type={type}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function NetworkBadge({
  offline,
  onToggle,
}) {
  const label = offline
    ? "Offline"
    : "Online";

  return (
    <button
      type="button"
      className={`network-badge ${
        offline
          ? "offline"
          : "online"
      }`}
      onClick={onToggle}
      aria-label={`Connection status: ${label}`}
    >
      <svg
        className="wifi-icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M2.7 8.6a14.2 14.2 0 0 1 18.6 0" />

        <path d="M5.8 12a9.6 9.6 0 0 1 12.4 0" />

        <path d="M8.9 15.4a4.8 4.8 0 0 1 6.2 0" />

        <circle
          cx="12"
          cy="19"
          r="1.25"
          className="wifi-dot"
        />
      </svg>

      <span>
        {label}
      </span>
    </button>
  );
}

export function StatusCard({
  status,
  title,
  text,
}) {
  const icon =
    status === "MATCH"
      ? "✓"
      : status === "NO_MATCH"
      ? "!"
      : "?";

  return (
    <div
      className={`status-card ${status.toLowerCase()}`}
    >
      <div
        className="status-icon"
        aria-hidden="true"
      >
        {icon}
      </div>

      <div>
        <div className="eyebrow">
          Verification result
        </div>

        <h2>
          {title}
        </h2>

        <p>
          {text}
        </p>
      </div>
    </div>
  );
}
