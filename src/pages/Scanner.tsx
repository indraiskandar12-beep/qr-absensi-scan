import AdminLayout from '@/components/layout/AdminLayout';
import QRScanner from '@/components/scanner/QRScanner';

const Scanner = () => {
  return (
    <AdminLayout>
      <QRScanner />
    </AdminLayout>
  );
};

export default Scanner;
