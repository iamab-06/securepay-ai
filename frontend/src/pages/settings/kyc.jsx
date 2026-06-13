import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, FileText, CheckCircle2, Clock, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from "../../services/api";

export default function KycPage() {
  const [kycData, setKycData] = useState(null);
  const [status, setStatus] = useState('LOADING');
  
  const [panNumber, setPanNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchKyc();
  }, []);

  const fetchKyc = async () => {
    try {
      const { data } = await api.get('/kyc/status');
      if (data && data.id) {
        setKycData(data);
        setStatus(data.status);
      } else {
        setStatus('PENDING');
      }
    } catch (err) {
      console.error(err);
      setStatus('PENDING');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Basic frontend validation
    if (panNumber.length !== 10) {
      setError('PAN must be exactly 10 characters');
      return;
    }
    if (aadhaarNumber.length !== 12 || !/^\d+$/.test(aadhaarNumber)) {
      setError('Aadhaar must be exactly 12 digits');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/kyc/submit', {
        panNumber: panNumber.toUpperCase(),
        aadhaarNumber
      });
      // Refresh status after submission
      await fetchKyc();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit KYC. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStatusCard = () => {
    if (status === 'LOADING') return null;

    if (status === 'VERIFIED') {
      return (
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 mb-8 text-center">
          <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="text-green-500" size={32} />
          </div>
          <h2 className="text-xl font-bold text-green-500 mb-2">Verification Complete</h2>
          <p className="text-green-500/80">
            Your identity has been successfully verified. You now have access to Enterprise transfer limits (₹1,000,000/txn).
          </p>
        </div>
      );
    }

    if (status === 'UNDER_REVIEW') {
      return (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 mb-8 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
            <Clock className="text-blue-500" size={32} />
          </div>
          <h2 className="text-xl font-bold text-blue-500 mb-2">Under Review</h2>
          <p className="text-blue-500/80">
            Your documents are currently being reviewed by our compliance team. This usually takes 1-2 business days.
          </p>
          <div className="mt-6 inline-block bg-background/50 px-4 py-2 rounded-lg text-sm text-foreground">
            Aadhaar on file: **** **** {kycData?.aadhaar_last4}
          </div>
        </div>
      );
    }

    if (status === 'REJECTED') {
      return (
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 mb-8 text-left">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 shrink-0 bg-destructive/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="text-destructive" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-destructive mb-1">Verification Rejected</h2>
              <p className="text-destructive/80 mb-3">
                We could not verify your identity with the provided information.
              </p>
              <div className="bg-background/80 p-4 rounded-xl border border-border">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Reason for Rejection</span>
                <span className="text-sm font-medium text-foreground">{kycData?.rejection_reason || 'Information mismatch'}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const showForm = status === 'PENDING' || status === 'REJECTED';

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Link to="/settings" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft size={16} /> Back to Settings
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-foreground mb-2 flex items-center gap-3">
          <Shield className="text-primary" size={32} /> Identity Verification
        </h1>
        <p className="text-muted-foreground">Secure your account and unlock higher limits.</p>
      </motion.div>

      {renderStatusCard()}

      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm"
          >
            <h2 className="text-xl font-bold text-foreground mb-6">Submit Documents</h2>
            
            {error && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive flex items-center gap-2">
                <AlertTriangle size={16} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">PAN Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    className="block w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                    placeholder="ABCDE1234F"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-2">Aadhaar Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={12}
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ''))}
                    className="block w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                    placeholder="1234 5678 9012"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Shield size={12} /> Your Aadhaar is securely hashed. We do not store your full number.
                </p>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting || !panNumber || !aadhaarNumber}
                  className="w-full bg-primary text-primary-foreground font-bold py-3.5 px-4 rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-premium"
                >
                  {isSubmitting ? 'Submitting securely...' : (status === 'REJECTED' ? 'Resubmit Documents' : 'Submit for Verification')}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
