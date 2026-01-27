import React from 'react';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error;
};

export class AdminFailSoft extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('[ADMIN DASHBOARD FAILURE]', error);
    console.error('[ADMIN COMPONENT STACK]', info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center px-6">
          <div className="max-w-xl w-full border border-red-500/30 rounded-xl p-6 bg-gray-900">
            <h1 className="text-red-400 text-xl font-semibold mb-2">
              Admin Dashboard Error
            </h1>
            <p className="text-gray-300 text-sm mb-4">
              The admin dashboard loaded but a component failed.
            </p>
            <p className="text-gray-500 text-xs mb-4">
              This does not affect clients or landscapers.
            </p>

            <details className="text-xs text-gray-400 whitespace-pre-wrap">
              {this.state.error?.message}
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AdminFailSoft;
