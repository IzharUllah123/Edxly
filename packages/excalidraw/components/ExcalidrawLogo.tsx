import "./ExcalidrawLogo.scss";

// Custom EDXLY branding component
export const ExcalidrawLogo = ({
  style,
  size = "small",
  withText,
}: {
  style?: React.CSSProperties;
  size?: "small" | "normal" | "large";
  withText?: boolean;
}) => {
  return (
    <div className={`ExcalidrawLogo is-${size}`} style={style}>
      {/* Icon with gradient */}
      <span className="ExcalidrawLogo-icon gradient-text">&#9998;</span>

      {/* Text with gradient */}
      {withText && (
        <span className="ExcalidrawLogo-text gradient-text">EDXLY</span>
      )}
    </div>
  );
};
