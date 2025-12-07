import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAddStudent } from '@/hooks/useStudents';
import { toast } from 'sonner';
import { studentSchema } from '@/lib/validations';

interface ImportStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ImportedStudent {
  nisn: string;
  full_name: string;
  class_name: string;
  major: string;
}

const ImportStudentsDialog = ({ open, onOpenChange }: ImportStudentsDialogProps) => {
  const [importedData, setImportedData] = useState<ImportedStudent[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addStudent = useAddStudent();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

        // Skip header row and parse data
        const parsedData: ImportedStudent[] = [];
        const parseErrors: string[] = [];

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length < 4) continue;

          const nisn = String(row[0] || '').trim();
          const full_name = String(row[1] || '').trim();
          const class_name = String(row[2] || '').trim();
          const major = String(row[3] || '').trim();

          // Validate using zod schema
          const validation = studentSchema.safeParse({ nisn, full_name, class_name, major });
          if (!validation.success) {
            const errorMsg = validation.error.errors[0]?.message || 'Data tidak valid';
            parseErrors.push(`Baris ${i + 1}: ${errorMsg}`);
            continue;
          }

          parsedData.push({ nisn, full_name, class_name, major });
        }

        setImportedData(parsedData);
        setErrors(parseErrors);

        if (parsedData.length === 0 && parseErrors.length === 0) {
          setErrors(['File tidak berisi data atau format tidak sesuai']);
        }
      } catch {
        setErrors(['Gagal membaca file. Pastikan format file benar.']);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (importedData.length === 0) return;

    setIsImporting(true);
    let successCount = 0;
    let failCount = 0;

    for (const student of importedData) {
      try {
        await addStudent.mutateAsync({
          ...student,
          is_active: true,
          qr_code_path: null,
        });
        successCount++;
      } catch {
        failCount++;
      }
    }

    setIsImporting(false);
    
    if (successCount > 0) {
      toast.success(`${successCount} siswa berhasil diimpor!`);
    }
    if (failCount > 0) {
      toast.error(`${failCount} siswa gagal diimpor`);
    }

    onOpenChange(false);
    setImportedData([]);
    setErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setImportedData([]);
    setErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Import Data Siswa
          </DialogTitle>
          <DialogDescription>
            Upload file Excel (.xlsx, .xls) atau CSV dengan format: NISN, Nama, Kelas, Jurusan
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Upload */}
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 hover:border-primary/50 transition-colors">
            <Upload className="w-10 h-10 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              Drag & drop file atau klik untuk memilih
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <Button variant="outline" asChild>
              <label htmlFor="file-upload" className="cursor-pointer">
                Pilih File
              </label>
            </Button>
          </div>

          {/* Format Guide */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Format file:</strong> Kolom A = NISN, Kolom B = Nama Lengkap, Kolom C = Kelas, Kolom D = Jurusan.
              Baris pertama diabaikan (header).
            </AlertDescription>
          </Alert>

          {/* Errors */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {errors.slice(0, 5).map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                  {errors.length > 5 && <li>...dan {errors.length - 5} error lainnya</li>}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Preview Data */}
          {importedData.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-green-500" />
                {importedData.length} data siap diimpor
              </div>
              <ScrollArea className="h-64 border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">No</TableHead>
                      <TableHead>NISN</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Jurusan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importedData.slice(0, 50).map((student, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-mono text-sm">{student.nisn}</TableCell>
                        <TableCell>{student.full_name}</TableCell>
                        <TableCell>{student.class_name}</TableCell>
                        <TableCell>{student.major}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {importedData.length > 50 && (
                  <p className="text-center text-sm text-muted-foreground py-2">
                    ...dan {importedData.length - 50} data lainnya
                  </p>
                )}
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Batal
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={importedData.length === 0 || isImporting}
          >
            {isImporting ? 'Mengimpor...' : `Import ${importedData.length} Siswa`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportStudentsDialog;
