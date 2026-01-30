import { Cloud, CloudOff, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { QueuedScan } from '@/hooks/useOfflineQueue';
import { cn } from '@/lib/utils';

interface OfflineQueueIndicatorProps {
  queue: QueuedScan[];
  isOnline: boolean;
  isSyncing: boolean;
  onSync: () => void;
  onClear: () => void;
  onRemove: (id: string) => void;
}

const OfflineQueueIndicator = ({
  queue,
  isOnline,
  isSyncing,
  onSync,
  onClear,
  onRemove,
}: OfflineQueueIndicatorProps) => {
  const hasQueue = queue.length > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "relative gap-2",
            !isOnline && "border-warning text-warning",
            hasQueue && isOnline && "border-info text-info"
          )}
        >
          {isOnline ? (
            <Cloud className="w-4 h-4" />
          ) : (
            <CloudOff className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">
            {isOnline ? 'Online' : 'Offline'}
          </span>
          {hasQueue && (
            <Badge
              variant="secondary"
              className={cn(
                "ml-1 h-5 min-w-5 px-1.5",
                isSyncing && "animate-pulse"
              )}
            >
              {queue.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Cloud className="w-4 h-4 text-success" />
              ) : (
                <CloudOff className="w-4 h-4 text-warning" />
              )}
              <span className="font-medium text-sm">
                {isOnline ? 'Terhubung' : 'Mode Offline'}
              </span>
            </div>
            {hasQueue && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onSync}
                  disabled={!isOnline || isSyncing}
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin")} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={onClear}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>

          {hasQueue ? (
            <>
              <p className="text-xs text-muted-foreground">
                {queue.length} scan menunggu sinkronisasi
              </p>
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {queue.map((scan) => (
                    <div
                      key={scan.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{scan.studentName}</p>
                        <p className="text-muted-foreground">
                          {scan.studentClass} • {scan.mode === 'check_in' ? 'Datang' : 'Pulang'}
                        </p>
                        <p className="text-muted-foreground">
                          {scan.localTime}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => onRemove(scan.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              {isSyncing && (
                <p className="text-xs text-center text-muted-foreground animate-pulse">
                  Menyinkronkan...
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">
              {isOnline 
                ? 'Semua data sudah tersinkronisasi' 
                : 'Scan tetap dapat digunakan. Data akan otomatis tersinkronisasi saat koneksi kembali.'}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default OfflineQueueIndicator;
