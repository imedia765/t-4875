import { Payment } from "./types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/dateFormat";

interface MemberPaymentsListProps {
  payments: Payment[];
}

export const MemberPaymentsList = ({ payments }: MemberPaymentsListProps) => {
  return (
    <div className="rounded-md border border-dashboard-highlight/20">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-dashboard-highlight">Payment #</TableHead>
            <TableHead className="text-dashboard-highlight">Date</TableHead>
            <TableHead className="text-dashboard-highlight">Member Name</TableHead>
            <TableHead className="text-dashboard-highlight">Member #</TableHead>
            <TableHead className="text-dashboard-highlight">Type</TableHead>
            <TableHead className="text-dashboard-highlight">Amount</TableHead>
            <TableHead className="text-dashboard-highlight">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell className="text-dashboard-text font-mono">
                {payment.payment_number || payment.id.slice(0, 8)}
              </TableCell>
              <TableCell className="text-dashboard-text">
                {formatDate(payment.date)}
              </TableCell>
              <TableCell className="text-dashboard-text">
                {payment.member_name || '-'}
              </TableCell>
              <TableCell className="text-dashboard-text">
                {payment.member_number || '-'}
              </TableCell>
              <TableCell className="text-dashboard-text">{payment.type}</TableCell>
              <TableCell className="text-dashboard-accent3">
                <span className="text-dashboard-accent3">£</span>{payment.amount}
              </TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full ${
                  payment.status === 'pending' 
                    ? 'bg-dashboard-warning/20 text-dashboard-warning'
                    : 'bg-dashboard-accent3/20 text-dashboard-accent3'
                }`}>
                  {payment.status}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};