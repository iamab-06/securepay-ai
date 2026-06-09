import React from 'react';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error('SecurePay Runtime Error Caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0B1020] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-card border border-border rounded-3xl p-8 shadow-2xl text-center">
            <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertOctagon size={32} strokeWidth={2.5} />
            </div>
            
            <h2 className="text-2xl font-black text-foreground tracking-tight mb-2">System Recovery</h2>
            <p className="text-muted-foreground text-sm font-medium mb-8 leading-relaxed">
              We encountered an unexpected error while rendering this page. Your funds and data are safe.
            </p>

            <div className="bg-muted/30 p-4 rounded-xl text-left mb-8 overflow-x-auto border border-border">
              <p className="text-xs font-mono text-destructive font-bold truncate">
                {this.state.error?.toString() || "Unknown Rendering Error"}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => window.location.reload()}
                className="w-full h-12 bg-primary text-white rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-premium"
              >
                <RotateCcw size={18} />
                Reload Application
              </button>
              
              <button 
                onClick={() => window.location.href = '/dashboard'}
                className="w-full h-12 bg-muted text-foreground rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 hover:bg-muted/80 transition-all"
              >
                <Home size={18} />
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
