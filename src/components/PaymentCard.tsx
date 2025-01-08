import { Card } from "@/components/ui/card";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { format, addDays, isAfter, isBefore, differenceInDays } from 'date-fns';
import { AlertOctagon, Check, Clock } from "lucide-react";

interface PaymentCardProps {
  annualPaymentStatus?: 'completed' | 'pending' | 'due' | 'overdue';
  emergencyCollectionStatus?: 'completed' | 'pending' | 'due' | 'overdue';
  emergencyCollectionAmount?: number;
  annualPaymentDueDate?: string;
  emergencyCollectionDueDate?: string;
  lastAnnualPaymentDate?: string;
  lastEmergencyPaymentDate?: string;
  lastAnnualPaymentAmount?: number;
  lastEmergencyPaymentAmount?: number;
}

const PaymentCard = ({ 
  annualPaymentStatus = 'pending',
  emergencyCollectionStatus = 'pending',
  emergencyCollectionAmount = 0,
  annualPaymentDueDate,
  emergencyCollectionDueDate,
  lastAnnualPaymentDate,
  lastEmergencyPaymentDate,
  lastAnnualPaymentAmount,
  lastEmergencyPaymentAmount
}: PaymentCardProps) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'January 1st, 2025';
    try {
      return format(new Date(dateString), 'MMMM do, yyyy');
    } catch (e) {
      return 'January 1st, 2025';
    }
  };

  const getPaymentStatusInfo = (dueDate?: string) => {
    const defaultDueDate = new Date('2025-01-01');
    const dueDateObj = dueDate ? new Date(dueDate) : defaultDueDate;
    const today = new Date();
    const twentyEightDaysAfterDue = addDays(dueDateObj, 28);
    const sevenDaysAfterGracePeriod = addDays(twentyEightDaysAfterDue, 7);
    
    if (isBefore(today, dueDateObj)) {
      return {
        color: 'text-blue-400',
        message: 'Due: January 1st, 2025',
        warning: null
      };
    } else if (isBefore(today, twentyEightDaysAfterDue)) {
      return {
        color: 'text-yellow-400',
        message: 'Payment overdue',
        warning: null
      };
    } else {
      const daysUntilDeactivation = differenceInDays(sevenDaysAfterGracePeriod, today);
      return {
        color: 'text-rose-500',
        message: 'Payment critically overdue',
        warning: daysUntilDeactivation > 0 
          ? `Account will be deactivated in ${daysUntilDeactivation} days`
          : 'Account deactivation pending'
      };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'due':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'overdue':
        return 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check className="h-6 w-6" />;
      case 'due':
        return <Clock className="h-6 w-6" />;
      case 'overdue':
        return <AlertOctagon className="h-6 w-6" />;
      case 'pending':
        return <Clock className="h-6 w-6" />;
      default:
        return <Clock className="h-6 w-6" />;
    }
  };

  const yearlyPaymentInfo = getPaymentStatusInfo(annualPaymentDueDate || '2025-01-01');

  return (
    <Card className="dashboard-card">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Annual Payment Section */}
        <div className="p-6 glass-card rounded-lg border border-white/10 hover:border-white/20 transition-colors">
          <h3 className="text-lg font-medium text-white mb-4">Annual Payment</h3>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-2xl font-bold text-white">£40</p>
              <p className={`text-lg font-bold ${yearlyPaymentInfo.color}`}>
                {yearlyPaymentInfo.message}
              </p>
              {yearlyPaymentInfo.warning && (
                <p className="text-sm text-rose-500 font-medium mt-2">
                  ⚠️ {yearlyPaymentInfo.warning}
                </p>
              )}
              {lastAnnualPaymentDate && (
                <div className="mt-2">
                  <p className="text-xs text-dashboard-muted">
                    Last payment: {formatDate(lastAnnualPaymentDate)}
                  </p>
                  {lastAnnualPaymentAmount && (
                    <p className="text-xs text-emerald-400">
                      Amount: £{lastAnnualPaymentAmount}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-lg backdrop-blur-sm ${getStatusColor(annualPaymentStatus)}`}>
                {annualPaymentStatus}
              </span>
              <div className="w-12 h-12" style={{ color: getStatusColor(annualPaymentStatus).split(' ')[1].replace('text-', '') }}>
                {getStatusIcon(annualPaymentStatus)}
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Collection Section */}
        <div className="p-6 glass-card rounded-lg border border-white/10 hover:border-white/20 transition-colors">
          <h3 className="text-lg font-medium text-white mb-4">Emergency Collection</h3>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-2xl font-bold text-white">
                £{emergencyCollectionAmount}
              </p>
              <p className="text-lg font-bold text-dashboard-warning">
                Due: {formatDate(emergencyCollectionDueDate)}
              </p>
              {lastEmergencyPaymentDate && (
                <div className="mt-2">
                  <p className="text-xs text-dashboard-muted">
                    Last payment: {formatDate(lastEmergencyPaymentDate)}
                  </p>
                  {lastEmergencyPaymentAmount && (
                    <p className="text-xs text-emerald-400">
                      Amount: £{lastEmergencyPaymentAmount}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-lg backdrop-blur-sm ${getStatusColor(emergencyCollectionStatus)}`}>
                {emergencyCollectionStatus}
              </span>
              <div className="w-12 h-12" style={{ color: getStatusColor(emergencyCollectionStatus).split(' ')[1].replace('text-', '') }}>
                {getStatusIcon(emergencyCollectionStatus)}
              </div>
            </div>
          </div>
          <div className="text-sm text-dashboard-text">
            {emergencyCollectionStatus === 'completed' 
              ? 'Payment completed' 
              : (
                <div className="space-y-1">
                  <p>Payment {emergencyCollectionStatus}</p>
                  <p className="text-dashboard-muted">
                    {emergencyCollectionStatus === 'overdue'
                      ? 'Emergency collection payment is overdue'
                      : 'One-time emergency collection payment required'}
                  </p>
                </div>
              )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PaymentCard;
