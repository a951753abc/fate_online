import type { RolePreference } from "../types/protocol.js";

interface RoleSelectorProps {
  readonly current: RolePreference;
  readonly onChange: (role: RolePreference) => void;
}

const roles: readonly RolePreference[] = ["master", "servant", "any"];

export function RoleSelector({ current, onChange }: RoleSelectorProps) {
  return (
    <div style={{ display: "flex", gap: "8px" }}>
      {roles.map((role) => (
        <button
          key={role}
          onClick={() => onChange(role)}
          style={{
            padding: "8px 16px",
            background: current === role ? "#1976d2" : "#e0e0e0",
            color: current === role ? "#fff" : "#333",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: current === role ? "bold" : "normal",
          }}
        >
          {role === "master" ? "マスター" : role === "servant" ? "サーヴァント" : "皆可"}
        </button>
      ))}
    </div>
  );
}
