const Loader = ({
  size = 'md',
  message = '',
  fullscreen = false,
  type = 'logo',
  className = '',
  compact = false,
  inline = false
}) => {
  const sizeMap = {
    xs: 14,
    sm: 20,
    md: 32,
    lg: 52,
    xl: 72
  };

  const resolvedSize = typeof size === 'number' ? size : (sizeMap[size] || sizeMap.md);
  const loaderMode = type || 'logo';
  const messageTextSize =
    resolvedSize <= 16 ? 'text-[11px]' :
      resolvedSize <= 24 ? 'text-xs' :
        resolvedSize <= 40 ? 'text-sm' :
          'text-base';

  const loader = (
    <div
      className="master-loader"
      style={{ '--loader-size': `${resolvedSize}px` }}
      data-loader-mode={loaderMode}
      aria-label="Loading"
      role="status"
    >
      <div className="master-loader-orbit" />
      <div className="master-loader-core">
        <div className="master-loader-logo">
          <span className="master-loader-plus-h" />
          <span className="master-loader-plus-v" />
          <span className="master-loader-scan" />
        </div>
      </div>
      <span className="master-loader-dot master-loader-dot-a" />
      <span className="master-loader-dot master-loader-dot-b" />
    </div>
  );

  const content = (
    <div className={`flex flex-col items-center justify-center ${compact ? 'gap-2' : 'gap-4'} ${className}`}>
      {loader}
      {message ? (
        <p className={`font-semibold tracking-wide text-gray-600 ${messageTextSize} px-4 text-center`}>
          {message}
        </p>
      ) : null}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/70 backdrop-blur-sm transition-all duration-300">
        <div className="bg-white p-8 rounded-2xl shadow-2xl border border-gray-100">
          {content}
        </div>
      </div>
    );
  }

  if (inline) {
    return content;
  }

  return (
    <div className="flex items-center justify-center py-4">
      {content}
    </div>
  );
};

export default Loader;
