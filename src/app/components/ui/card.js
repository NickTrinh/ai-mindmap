const Card = ({ children, className = '' }) => (
  <div
    className={`bg-white dark:bg-gray-800 rounded-lg shadow-md ${className}`}
  >
    {children}
  </div>
);

const CardHeader = ({ children, className = '' }) => (
  <div
    className={`p-4 border-b border-gray-200 dark:border-gray-700 ${className}`}
  >
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }) => (
  <h3
    className={`text-lg font-semibold text-gray-900 dark:text-gray-100 ${className}`}
  >
    {children}
  </h3>
);

const CardContent = ({ children, className = '' }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);

export { Card, CardHeader, CardTitle, CardContent };
