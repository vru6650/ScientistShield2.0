import React from 'react';
import PropTypes from 'prop-types';

import reportError from '../utils/reportError.js';

const DefaultFallback = ({ error, resetErrorBoundary }) => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 px-6 text-center">
        <div className="max-w-lg space-y-4">
            <h1 className="text-3xl font-semibold">Something went wrong</h1>
            <p className="text-slate-300">
                An unexpected error occurred while rendering this page. Our team has been notified.
                You can try again or return to the previous page.
            </p>
            {error?.message && (
                <pre className="mt-4 whitespace-pre-wrap break-words rounded-lg bg-slate-900/70 p-4 text-sm text-rose-300 shadow-inner">
                    {error.message}
                </pre>
            )}
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <button
                    type="button"
                    onClick={resetErrorBoundary}
                    className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                >
                    Try again
                </button>
                <button
                    type="button"
                    onClick={() => window.location.assign('/')}
                    className="rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                    Go home
                </button>
            </div>
        </div>
    </div>
);

DefaultFallback.propTypes = {
    error: PropTypes.instanceOf(Error),
    resetErrorBoundary: PropTypes.func.isRequired,
};

DefaultFallback.defaultProps = {
    error: null,
};

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
        this.resetErrorBoundary = this.resetErrorBoundary.bind(this);
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        const { onError } = this.props;
        const reporter = typeof onError === 'function' ? onError : reportError;

        reporter(error, errorInfo);
    }

    resetErrorBoundary() {
        if (typeof this.props.onReset === 'function') {
            this.props.onReset();
        }

        this.setState({ hasError: false, error: null });
    }

    render() {
        const { fallback, children } = this.props;
        const { hasError, error } = this.state;

        if (hasError) {
            if (typeof fallback === 'function') {
                return fallback({ error, resetErrorBoundary: this.resetErrorBoundary });
            }

            if (React.isValidElement(fallback)) {
                return fallback;
            }

            return (
                <DefaultFallback error={error} resetErrorBoundary={this.resetErrorBoundary} />
            );
        }

        return children;
    }
}

ErrorBoundary.propTypes = {
    children: PropTypes.node.isRequired,
    fallback: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
    onError: PropTypes.func,
    onReset: PropTypes.func,
};

ErrorBoundary.defaultProps = {
    fallback: null,
    onError: undefined,
    onReset: undefined,
};

export const withErrorBoundary = (Component, boundaryProps = {}) => {
    const WrappedComponent = (props) => (
        <ErrorBoundary {...boundaryProps}>
            <Component {...props} />
        </ErrorBoundary>
    );

    const componentName = Component.displayName || Component.name || 'Component';
    WrappedComponent.displayName = `withErrorBoundary(${componentName})`;

    return WrappedComponent;
};

export default ErrorBoundary;
